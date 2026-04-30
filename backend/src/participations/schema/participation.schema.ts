import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'participations' })
export class Participation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
  activityId!: Types.ObjectId;

  @Prop({
    default: 'accepted',
    enum: [
      // Legacy values (kept for backward compatibility)
      'started',
      'completed',
      'cancelled',
      // New full lifecycle statuses
      'pending_response', // Employee notified, awaiting response
      'accepted', // Employee accepted
      'declined', // Employee declined initial invitation (with reason)
      'in_progress', // Activity has started
      'withdrawn', // Employee withdrew AFTER accepting (with mandatory reason)
      'awaiting_organizer', // Activity ended, manager (organizer) must submit attendance
      'organizer_submitted', // Manager submitted attendance report
      'awaiting_manager', // Waiting for manager final validation
      'validated', // Manager validated — scores updated
      'not_completed', // Manager rejected or employee not completed
    ],
  })
  status!: string;

  @Prop({ default: 0, min: 0, max: 100 })
  progress!: number;

  @Prop({ default: 0, min: 0, max: 10 })
  feedback!: number;

  @Prop({ type: Date, default: Date.now })
  lastUpdated!: Date;

  // ─── Flow 1: Acceptance / Declination / Withdrawal ───────────────────────

  @Prop({ type: String, default: null })
  declineReason?: string | null;

  @Prop({ type: Date, default: null })
  declinedAt?: Date | null;

  /** Tracks when the last response reminder was sent to the employee */
  @Prop({ type: Date, default: null })
  reminderSentAt?: Date | null;

  /** Reason provided when an employee withdraws after having accepted */
  @Prop({ type: String, default: null })
  withdrawalReason?: string | null;

  /** Timestamp when the employee withdrew */
  @Prop({ type: Date, default: null })
  withdrawnAt?: Date | null;

  // ─── Flow 2: Completion Tracking ─────────────────────────────────────────

  /** When the cron job transitioned this participation to awaiting_organizer */
  @Prop({ type: Date, default: null })
  awaitingOrganizerSince?: Date | null;

  /** Rating given by the manager/organizer (1–5) in the attendance report */
  @Prop({ type: Number, min: 1, max: 5, default: null })
  organizerRating?: number | null;

  /** Optional note from the manager/organizer */
  @Prop({ type: String, default: null })
  organizerNote?: string | null;

  /** Timestamp when the attendance report was submitted */
  @Prop({ type: Date, default: null })
  organizerSubmittedAt?: Date | null;

  /** Timestamp of the manager's final validation */
  @Prop({ type: Date, default: null })
  managerValidatedAt?: Date | null;

  /** Reason provided if the manager rejected the completion */
  @Prop({ type: String, default: null })
  managerRejectionReason?: string | null;
}

export const ParticipationSchema = SchemaFactory.createForClass(Participation);
