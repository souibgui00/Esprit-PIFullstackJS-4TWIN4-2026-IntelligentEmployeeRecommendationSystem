import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryPostsDto } from './dto/query-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UsersService } from '../users/users.service';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
    constructor(
        private readonly postsService: PostsService,
        private readonly usersService: UsersService,
    ) { }

    private async getRequestUserProfile(userId: string): Promise<{ name?: string; avatar?: string }> {
        try {
            const user = await this.usersService.findOne(userId);
            return {
                name: (user as any)?.name,
                avatar: (user as any)?.avatar,
            };
        } catch {
            return {};
        }
    }

    private usesAdvancedQuery(query: QueryPostsDto): boolean {
        return [
            query.type,
            query.search,
            query.tag,
            query.authorId,
            query.page,
            query.limit,
            query.sort,
            query.mine,
        ].some((value) => value !== undefined);
    }

    @Post()
    async create(@Request() req: any, @Body() body: CreatePostDto) {
        const profile = await this.getRequestUserProfile(req.user.userId);

        // Fill in author info from request user if not provided
        const postData = {
            ...body,
            authorId: req.user.userId,
            authorName: body.authorName || profile.name || 'Unknown User',
            authorAvatar: body.authorAvatar || profile.avatar,
        };

        return this.postsService.create(postData as any);
    }

    @Get('bookmarks/me')
    async findMyBookmarks(@Request() req: any) {
        return this.postsService.findBookmarkedByUser(req.user.userId);
    }

    @Get('profile/me')
    async getMyProfileFeed(@Request() req: any) {
        const profile = await this.getRequestUserProfile(req.user.userId);
        const feed = await this.postsService.getUserProfileFeed(req.user.userId);
        return {
            user: {
                userId: req.user.userId,
                name: profile.name || 'Unknown User',
                avatar: profile.avatar || '',
            },
            ...feed,
        };
    }

    @Get('profile/:userId')
    async getUserProfileFeed(@Param('userId') userId: string) {
        const profile = await this.getRequestUserProfile(userId);
        const feed = await this.postsService.getUserProfileFeed(userId);
        return {
            user: {
                userId,
                name: profile.name || 'Unknown User',
                avatar: profile.avatar || '',
            },
            ...feed,
        };
    }

    @Get('user/:userId/publications')
    async getUserPublications(@Param('userId') userId: string) {
        return this.postsService.getUserPublications(userId);
    }

    @Get('user/:userId/shares')
    async getUserShares(@Param('userId') userId: string) {
        return this.postsService.getUserShares(userId);
    }

    @Get('trending/tags')
    async getTrendingTags(@Query('limit') limit?: string) {
        const parsedLimit = Number(limit);
        const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 10;
        return this.postsService.getTrendingTags(safeLimit);
    }

    @Get()
    async findAll(@Request() req: any, @Query() query: QueryPostsDto) {
        if (!this.usesAdvancedQuery(query)) {
            return this.postsService.findAll();
        }

        return this.postsService.findAllAdvanced(query, req.user.userId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.postsService.findOne(id);
    }

    @Patch(':id')
    async update(@Request() req: any, @Param('id') id: string, @Body() body: UpdatePostDto) {
        return this.postsService.update(id, req.user.userId, req.user.role, body);
    }

    @Post(':id/bookmark')
    async toggleBookmark(@Request() req: any, @Param('id') id: string) {
        return this.postsService.toggleBookmark(id, req.user.userId);
    }

    @Post(':id/share')
    async sharePost(@Request() req: any, @Param('id') id: string, @Body() body: { content?: string }) {
        const profile = await this.getRequestUserProfile(req.user.userId);
        return this.postsService.sharePost(id, {
            userId: req.user.userId,
            authorName: profile.name || 'Unknown User',
            authorAvatar: profile.avatar,
            content: body?.content,
        });
    }

    @Post(':id/like')
    async like(@Request() req: any, @Param('id') id: string) {
        const userId = req.user.userId;
        return this.postsService.like(id, userId);
    }

    @Post(':id/comment')
    async comment(@Request() req: any, @Param('id') id: string, @Body() body: { content: string }) {
        const profile = await this.getRequestUserProfile(req.user.userId);
        const commentData = {
            authorId: req.user.userId,
            authorName: profile.name || 'Unknown User',
            authorAvatar: profile.avatar || '',
            content: body.content,
        };

        return this.postsService.comment(id, commentData);
    }

    @Delete(':id')
    async remove(@Request() req: any, @Param('id') id: string) {
        return this.postsService.remove(id, req.user.userId, req.user.role);
    }
}
