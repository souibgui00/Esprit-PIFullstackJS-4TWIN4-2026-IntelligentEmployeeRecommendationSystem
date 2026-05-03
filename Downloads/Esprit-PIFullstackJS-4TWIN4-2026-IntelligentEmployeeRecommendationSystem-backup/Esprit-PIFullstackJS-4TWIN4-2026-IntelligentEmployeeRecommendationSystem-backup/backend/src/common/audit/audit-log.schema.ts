import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'auditlogs' })
export class AuditLog extends Document {
  @Prop({ type: String, required: true })
  action!: string; // e.g., 'CREATE_USER', 'DELETE_ACTIVITY'

  @Prop({ type: String, required: true })
  entityType!: string; // e.g., 'User', 'Activity'

  @Prop({ type: String, required: true })
  entityId!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  actorId!: string; // User who performed the action

  @Prop({ type: Object })
  oldValue?: Record<string, any>; // Previous state (for updates/deletes)

  @Prop({ type: Object })
  newValue?: Record<string, any>; // New state (for creates/updates)

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Additional info (IP address, user agent, etc.)
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
