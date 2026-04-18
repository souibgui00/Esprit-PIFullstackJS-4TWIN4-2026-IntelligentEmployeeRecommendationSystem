import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'activities' })
export class Activity extends Document {
    @Prop({ required: true })
    title!: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy!: Types.ObjectId;

    @Prop({ required: true })
    description!: string;

    @Prop({ required: true, enum: ['training', 'workshop', 'mentoring', 'webinar'] })
    type!: string;

    @Prop({ required: true })
    date!: string;

    @Prop({ required: true })
    duration!: string;

    @Prop({ default: 0 })
    enrolledCount!: number;

    @Prop({ default: 20 })
    capacity!: number;

    @Prop({ default: 'open', enum: ['open', 'closed', 'completed'] })
    status!: string;

    @Prop([String])
    skillsCovered!: string[];

    @Prop({ default: 'beginner', enum: ['beginner', 'intermediate', 'advanced'] })
    level!: string;

    /**
     * Recommendation intent — controls who gets recommended:
     * - 'development': recommend employees who LACK the skills (workshop, training)
     * - 'performance': recommend employees who HAVE the skills (delivery, expert tasks)
     * - 'balanced': recommend mid-range employees (mentoring, webinars)
     * Auto-inferred from `type` if not explicitly set.
     */
    @Prop({ default: 'development', enum: ['development', 'performance', 'balanced'] })
    intent!: string;

    @Prop({ default: 'pending_approval', enum: ['pending_approval', 'approved', 'rejected'] })
    workflowStatus!: string;

    @Prop({ type: String, default: null })
    approvedBy?: string;

    @Prop({ type: Date, default: null })
    approvedAt?: Date;

    @Prop({ type: String, default: null })
    rejectedBy?: string;

    @Prop({ type: Date, default: null })
    rejectedAt?: Date;

    @Prop({ type: String, default: null })
    rejectionReason?: string;

    @Prop({ type: String, default: null })
    location?: string;

    @Prop({ type: [String], default: [] })
    targetDepartments?: string[];

    @Prop({ type: Types.ObjectId, ref: 'User', default: null })
    organizerId?: Types.ObjectId;

    @Prop({
      type: [{
        skillId: { type: String, required: true },
        weight: { type: Number, default: 0.5, min: 0.1, max: 2.0 },
        requiredLevel: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
          default: 'beginner'
        },
      }],
      default: []
    })
    requiredSkills!: { skillId: string; weight: number; requiredLevel: string }[];
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

ActivitySchema.post('findOneAndDelete', async function (doc: any) {
    if (doc) {
        try {
            await this.model.db.model('Participation').deleteMany({ activityId: doc._id });
            await this.model.db.model('Assignment').deleteMany({ activityId: doc._id });
            console.log(`[Activity Cleanup] Removed participations and assignments for deleted activity: ${doc._id}`);
        } catch (error) {
            console.error('[Activity Cleanup] Failed to run cascading deletes:', error);
        }
    }
});

