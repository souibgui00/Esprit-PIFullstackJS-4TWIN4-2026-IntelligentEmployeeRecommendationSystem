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

    @Prop({ default: 'update', enum: ['update', 'announcement', 'achievement'] })
    type!: string;

    @Prop({ type: [String], default: [] })
    likes!: string[];

    @Prop({
        type: [{
            authorId: { type: Types.ObjectId, ref: 'User' },
            authorName: String,
            authorAvatar: String,
            content: String,
            createdAt: { type: Date, default: Date.now },
        }],
        default: [],
    })
    comments!: any[];
}

export const PostSchema = SchemaFactory.createForClass(Post);
