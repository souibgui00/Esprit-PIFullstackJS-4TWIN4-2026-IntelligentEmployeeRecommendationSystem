import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true })
  matricule!: string;

  @Prop()
  telephone?: string;

  @Prop()
  date_embauche?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  department_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  manager_id?: Types.ObjectId;

  @Prop({ default: 'active' })
  status!: string;

  @Prop({ default: false })
  en_ligne!: boolean;

  @Prop({ enum: Role, default: Role.EMPLOYEE })
  role!: Role;

  @Prop()
  avatar?: string;

  @Prop()
  position?: string;

  @Prop()
  jobDescription?: string;

  @Prop({ type: Number, default: 0 })
  yearsOfExperience?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);

