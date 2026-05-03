import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from './schema/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    private readonly httpService: HttpService,
  ) {}

  private readonly privilegedRoles = new Set(['ADMIN', 'HR']);

  private isPrivileged(role?: string): boolean {
    return this.privilegedRoles.has((role || '').toUpperCase());
  }

  private extractTags(content: string): string[] {
    const matches = content.match(/#([a-zA-Z0-9_-]{2,30})/g) || [];
    return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))].slice(
      0,
      15,
    );
  }

  private toObjectId(id: string, fieldName: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${fieldName}`);
    }
    return new Types.ObjectId(id);
  }

  private analyzeSentimentFallback(content: string): {
    label: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence?: number;
    source?: string;
  } {
    const text = content.toLowerCase();
    const positiveWords = [
      'good',
      'great',
      'excellent',
      'awesome',
      'love',
      'nice',
      'perfect',
      'happy',
      'amazing',
      'bien',
      'super',
      'excellent',
      'bravo',
      'merci',
      'parfait',
      'genial',
      'heureux',
      'top',
    ];
    const negativeWords = [
      'bad',
      'poor',
      'awful',
      'hate',
      'terrible',
      'bug',
      'issue',
      'problem',
      'angry',
      'mauvais',
      'nul',
      'horrible',
      'erreur',
      'probleme',
      'lent',
      'decu',
      'triste',
    ];

    let pos = 0;
    let neg = 0;

    for (const word of positiveWords) {
      if (text.includes(word)) pos += 1;
    }

    for (const word of negativeWords) {
      if (text.includes(word)) neg += 1;
    }

    const total = pos + neg;
    if (total === 0) {
      return { label: 'neutral', score: 0 };
    }

    const score = Number(((pos - neg) / total).toFixed(2));
    if (score > 0.2)
      return {
        label: 'positive',
        score,
        confidence: Math.min(1, Math.abs(score)),
        source: 'fallback',
      };
    if (score < -0.2)
      return {
        label: 'negative',
        score,
        confidence: Math.min(1, Math.abs(score)),
        source: 'fallback',
      };
    return {
      label: 'neutral',
      score,
      confidence: Math.min(1, Math.abs(score)),
      source: 'fallback',
    };
  }

  private async analyzeSentiment(content: string): Promise<{
    label: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence?: number;
    source?: string;
  }> {
    const nlpServiceUrl =
      process.env.NLP_SERVICE_URL || 'http://localhost:8000';

    try {
      const response = await firstValueFrom(
        this.httpService.post<{
          label?: string;
          score?: number;
          confidence?: number;
        }>(`${nlpServiceUrl}/analyze-sentiment`, {
          text: content,
        }),
      );

      const label = response?.data?.label;
      const score =
        typeof response?.data?.score === 'number' ? response.data.score : 0;
      const confidence =
        typeof response?.data?.confidence === 'number'
          ? response.data.confidence
          : undefined;

      if (label === 'positive' || label === 'negative' || label === 'neutral') {
        return { label, score, confidence, source: 'nlp-service' };
      }
    } catch (error: any) {
      console.warn(
        '[PostsService] NLP sentiment unavailable, falling back to local analyzer:',
        error?.message || error,
      );
    }

    return this.analyzeSentimentFallback(content);
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private ensureCanManagePost(post: Post, userId: string, role?: string): void {
    const isOwner = String(post.authorId) === String(userId);
    if (!isOwner && !this.isPrivileged(role)) {
      throw new ForbiddenException('You are not allowed to modify this post');
    }
  }

  private getAdvancedSort(
    sort?: 'latest' | 'top' | 'discussed',
  ): Record<string, 1 | -1> {
    if (sort === 'top') {
      return {
        isPinned: -1,
        likesCount: -1,
        commentsCount: -1,
        createdAt: -1,
      } as const;
    }

    if (sort === 'discussed') {
      return {
        isPinned: -1,
        commentsCount: -1,
        likesCount: -1,
        createdAt: -1,
      } as const;
    }

    return { isPinned: -1, createdAt: -1 } as const;
  }

  async create(createPostDto: CreatePostDto): Promise<Post> {
    const content = (createPostDto.content || '').trim();
    if (!content) {
      throw new BadRequestException('Post content is required');
    }

    const createdPost = new this.postModel({
      ...createPostDto,
      content,
      tags: this.extractTags(content),
    });

    return createdPost.save();
  }

  async findAll(): Promise<Post[]> {
    return this.postModel.find().sort({ isPinned: -1, createdAt: -1 }).exec();
  }

  async findAllAdvanced(query: QueryPostsDto, userId?: string) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.max(1, Math.min(query.limit ?? 10, 50));
    const skip = (page - 1) * limit;

    const match: Record<string, any> = {};

    if (query.type) {
      match.type = query.type;
    }

    if (query.authorId) {
      match.authorId = this.toObjectId(query.authorId, 'authorId');
    }

    if (query.mine && userId) {
      match.authorId = this.toObjectId(userId, 'userId');
    }

    if (query.tag) {
      match.tags = query.tag.replace(/^#/, '').toLowerCase();
    }

    if (query.search?.trim()) {
      const search = this.escapeRegex(query.search.trim());
      const regex = new RegExp(search, 'i');
      match.$or = [{ content: regex }, { authorName: regex }, { tags: regex }];
    }

    const [result] = await this.postModel.aggregate([
      { $match: match },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          commentsCount: { $size: { $ifNull: ['$comments', []] } },
        },
      },
      { $sort: this.getAdvancedSort(query.sort) },
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const items = result?.items || [];
    const total = result?.total?.[0]?.count || 0;

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  async like(id: string, userId: string): Promise<Post> {
    const post = await this.findOne(id);
    const index = post.likes.indexOf(userId);
    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }
    return post.save();
  }

  async comment(
    id: string,
    commentData: {
      authorId: string;
      authorName: string;
      authorAvatar: string;
      content: string;
    },
  ): Promise<Post> {
    const content = (commentData.content || '').trim();
    if (!content) {
      throw new BadRequestException('Comment content is required');
    }

    const post = await this.findOne(id);
    post.comments.push({
      ...commentData,
      content,
      sentiment: await this.analyzeSentiment(content),
      createdAt: new Date(),
    });
    return post.save();
  }

  async sharePost(
    postId: string,
    userData: {
      userId: string;
      authorName: string;
      authorAvatar?: string;
      content?: string;
    },
  ): Promise<Post> {
    const sourcePost = await this.findOne(postId);

    const shareText = (userData.content || '').trim();
    const finalContent = shareText || `Shared from ${sourcePost.authorName}`;

    const sharedPost = new this.postModel({
      authorId: userData.userId,
      authorName: userData.authorName,
      authorAvatar: userData.authorAvatar,
      content: finalContent,
      type: sourcePost.type,
      tags: [
        ...new Set([
          ...this.extractTags(finalContent),
          ...(sourcePost.tags || []),
        ]),
      ].slice(0, 15),
      isShare: true,
      sharedPostId: sourcePost._id,
      originalPost: {
        postId: sourcePost._id,
        authorId: sourcePost.authorId,
        authorName: sourcePost.authorName,
        authorAvatar: sourcePost.authorAvatar,
        content: sourcePost.content,
        postType: sourcePost.type,
        createdAt: (sourcePost as any).createdAt,
      },
    });

    const createdShare = await sharedPost.save();

    if (!sourcePost.shares.includes(userData.userId)) {
      sourcePost.shares.push(userData.userId);
      await sourcePost.save();
    }

    return createdShare;
  }

  async getUserPublications(userId: string): Promise<Post[]> {
    return this.postModel
      .find({
        authorId: this.toObjectId(userId, 'userId'),
        isShare: { $ne: true },
      })
      .sort({ isPinned: -1, createdAt: -1 })
      .exec();
  }

  async getUserShares(userId: string): Promise<Post[]> {
    return this.postModel
      .find({ authorId: this.toObjectId(userId, 'userId'), isShare: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getUserProfileFeed(userId: string) {
    const userObjectId = this.toObjectId(userId, 'userId');

    const [publications, shares, likedReceivedAgg, commentsReceivedAgg] =
      await Promise.all([
        this.getUserPublications(userId),
        this.getUserShares(userId),
        this.postModel.aggregate([
          { $match: { authorId: userObjectId } },
          { $project: { likesCount: { $size: { $ifNull: ['$likes', []] } } } },
          { $group: { _id: null, total: { $sum: '$likesCount' } } },
        ]),
        this.postModel.aggregate([
          { $match: { authorId: userObjectId } },
          {
            $project: {
              commentsCount: { $size: { $ifNull: ['$comments', []] } },
            },
          },
          { $group: { _id: null, total: { $sum: '$commentsCount' } } },
        ]),
      ]);

    const likedReceived = likedReceivedAgg?.[0]?.total || 0;
    const commentsReceived = commentsReceivedAgg?.[0]?.total || 0;

    return {
      stats: {
        publications: publications.length,
        shares: shares.length,
        likesReceived: likedReceived,
        commentsReceived,
      },
      publications,
      shares,
    };
  }

  async update(
    id: string,
    userId: string,
    role: string | undefined,
    updatePostDto: UpdatePostDto,
  ): Promise<Post> {
    const post = await this.findOne(id);
    this.ensureCanManagePost(post, userId, role);

    if (updatePostDto.isPinned !== undefined && !this.isPrivileged(role)) {
      throw new ForbiddenException('Only ADMIN/HR can pin posts');
    }

    const payload: Record<string, unknown> = {};

    if (updatePostDto.content !== undefined) {
      const content = updatePostDto.content.trim();
      if (!content) {
        throw new BadRequestException('Post content cannot be empty');
      }
      payload.content = content;
      payload.tags = this.extractTags(content);
    }

    if (updatePostDto.type !== undefined) {
      payload.type = updatePostDto.type;
    }

    if (updatePostDto.isPinned !== undefined) {
      payload.isPinned = updatePostDto.isPinned;
    }

    if (Object.keys(payload).length === 0) {
      return post;
    }

    const updated = await this.postModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }

    return updated;
  }

  async toggleBookmark(id: string, userId: string): Promise<Post> {
    const post = await this.findOne(id);
    const index = post.bookmarks.indexOf(userId);

    if (index === -1) {
      post.bookmarks.push(userId);
    } else {
      post.bookmarks.splice(index, 1);
    }

    return post.save();
  }

  async findBookmarkedByUser(userId: string): Promise<Post[]> {
    return this.postModel
      .find({ bookmarks: userId })
      .sort({ isPinned: -1, createdAt: -1 })
      .exec();
  }

  async getTrendingTags(limit = 10) {
    const safeLimit = Math.max(1, Math.min(limit, 30));
    return this.postModel.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', usageCount: { $sum: 1 } } },
      { $sort: { usageCount: -1 } },
      { $limit: safeLimit },
      { $project: { _id: 0, tag: '$_id', usageCount: 1 } },
    ]);
  }

  async remove(id: string, userId: string, role?: string): Promise<any> {
    const post = await this.findOne(id);
    this.ensureCanManagePost(post, userId, role);
    return this.postModel.findByIdAndDelete(id).exec();
  }
}
