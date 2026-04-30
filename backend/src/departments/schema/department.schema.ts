import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'departments' })
export class Department extends Document {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  manager_id?: Types.ObjectId;

  @Prop({ type: String, unique: true, required: true })
  code!: string;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
