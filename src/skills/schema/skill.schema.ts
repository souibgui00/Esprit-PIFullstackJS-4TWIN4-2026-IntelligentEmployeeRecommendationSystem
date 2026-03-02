import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'skills' })
export class Skill extends Document {
    @Prop({ required: true })
    name!: string;

    @Prop({ required: true, enum: ['knowledge', 'knowHow', 'softSkill'] })
    type!: string;

    @Prop()
    description!: string;

    @Prop()
    category!: string;
}

export const SkillSchema = SchemaFactory.createForClass(Skill);
