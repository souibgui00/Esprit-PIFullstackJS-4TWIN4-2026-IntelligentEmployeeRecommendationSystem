import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'activityrequests' })
export class ActivityRequest extends Document {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({ type: [String], required: true })
  requiredSkills!: string[];

  @Prop({ type: Number, required: true })
  seatCount!: number;

  @Prop({ type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requestedBy!: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: string;

  @Prop({ type: Date })
  reviewedAt?: Date;

  @Prop({ type: String })
  rejectionReason?: string;
}

export const ActivityRequestSchema = SchemaFactory.createForClass(ActivityRequest);
