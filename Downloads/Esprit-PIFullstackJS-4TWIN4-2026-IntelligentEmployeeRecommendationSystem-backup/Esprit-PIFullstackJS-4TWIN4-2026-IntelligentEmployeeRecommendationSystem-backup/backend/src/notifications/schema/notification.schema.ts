import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipientId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  @Prop({ default: false })
  read!: boolean;

  @Prop({ required: true })
  type!: string; // e.g., 'activity_created', 'activity_approved', 'activity_rejected'

  @Prop({ type: Object })
  metadata?: any; // e.g., { activityId: '...' }
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
