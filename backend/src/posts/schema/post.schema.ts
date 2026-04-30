import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'posts' })
export class Post extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId!: Types.ObjectId;

  @Prop({ required: true })
  authorName!: string;

  @Prop()
  authorAvatar?: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ default: 'update', enum: ['update', 'announcement', 'achievement'] })
  type!: string;

  @Prop({ default: false })
  isPinned!: boolean;

  @Prop({ type: [String], default: [] })
  likes!: string[];

  @Prop({ type: [String], default: [] })
  shares!: string[];

  @Prop({ type: [String], default: [] })
  bookmarks!: string[];

  @Prop({ default: false })
  isShare!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Post' })
  sharedPostId?: Types.ObjectId;

  @Prop({
    type: {
      postId: { type: Types.ObjectId, ref: 'Post' },
      authorId: { type: Types.ObjectId, ref: 'User' },
      authorName: String,
      authorAvatar: String,
      content: String,
      postType: String,
      createdAt: Date,
    },
    required: false,
  })
  originalPost?: any;

  @Prop({
    type: [
      {
        authorId: { type: Types.ObjectId, ref: 'User' },
        authorName: String,
        authorAvatar: String,
        content: String,
        sentiment: {
          label: {
            type: String,
            enum: ['positive', 'negative', 'neutral'],
            default: 'neutral',
          },
          score: { type: Number, default: 0 },
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  comments!: any[];
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ isPinned: -1, createdAt: -1 });
PostSchema.index({ authorId: 1, createdAt: -1 });
PostSchema.index({ tags: 1, createdAt: -1 });
PostSchema.index({ sharedPostId: 1, createdAt: -1 });
