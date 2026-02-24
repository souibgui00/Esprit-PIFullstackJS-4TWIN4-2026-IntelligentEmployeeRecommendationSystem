import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  matricule!: string;

  @Prop({ required: true })
  telephone!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ required: true })
  date_embauche!: Date;

  @Prop({ type: Types.ObjectId, required: true })
  department_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null })
  manager_id!: Types.ObjectId;

  @Prop({ enum: Role, default: Role.EMPLOYEE })
  role!: Role;

  @Prop({ default: 'active' })
  status!: string;

  @Prop({ default: false })
  en_ligne!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

