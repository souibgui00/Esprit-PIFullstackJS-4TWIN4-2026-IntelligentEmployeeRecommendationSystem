import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'participations' })
export class Participation extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
    activityId!: Types.ObjectId;

    @Prop({ default: 'started', enum: ['started', 'completed', 'cancelled'] })
    status!: string;

    @Prop({ default: 0, min: 0, max: 100 })
    progress!: number;

    @Prop({ default: 0, min: 0, max: 10 })
    feedback!: number;

    @Prop({ type: Date, default: Date.now })
    lastUpdated!: Date;
}

export const ParticipationSchema = SchemaFactory.createForClass(Participation);
