import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'assignments' })
export class Assignment extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
    activityId!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    assignedBy!: Types.ObjectId;

    @Prop({ default: 'pending', enum: ['pending', 'pending_manager', 'confirmed', 'notified', 'accepted', 'rejected', 'declined'] })
    status!: string;

    @Prop({ type: Date, default: Date.now })
    assignedAt!: Date;

    // Forward to Manager specific fields
    @Prop({ type: Types.ObjectId, ref: 'User' })
    managerId?: Types.ObjectId;

    @Prop({ default: 'direct_assignment', enum: ['direct_assignment', 'recommendation'] })
    type!: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    recommendedBy?: Types.ObjectId;

    @Prop({ type: Object })
    metadata?: {
        aiScore?: number;
        skillGaps?: string[];
        reason?: string;
    };

    @Prop({ type: String, default: null })
    reason?: string | null;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);
