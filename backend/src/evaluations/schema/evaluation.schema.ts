import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Evaluation extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  employeeId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  evaluatorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Activity' })
  activityId?: Types.ObjectId;

  @Prop({ required: true })
  overallScore!: number;

  @Prop([{
    skillId: { type: Types.ObjectId, ref: 'Skill' },
    previousScore: Number,
    previousLevel: String,
    newScore: Number,
    newLevel: String
  }])
  skillEvaluations!: any[];

  @Prop({ default: 'pending', enum: ['pending', 'approved', 'draft'] })
  status!: string;

  @Prop()
  feedback!: string;

  @Prop()
  recommendations!: string;

  @Prop({ 
    type: String, 
    enum: ['pre-activity', 'post-activity', 'monthly', 'annual', 'periodic', 'self-assessment', '3-months', '6-months'],
    default: 'post-activity' 
  })
  evaluationType!: string;

  @Prop()
  period!: string; // e.g., "Q1 2024" or "March 2024"

  @Prop({ type: Date, default: Date.now })
  date!: Date;
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation);
