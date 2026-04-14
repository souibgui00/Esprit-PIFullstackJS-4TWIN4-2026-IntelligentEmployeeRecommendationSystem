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

SkillSchema.post('findOneAndDelete', async function (doc: any) {
    if (doc) {
        try {
            await this.model.db.model('Evaluation').deleteMany({ skillId: doc._id });
            console.log(`[Skill Cleanup] Removed evaluations for deleted skill: ${doc._id}`);
        } catch (error) {
            console.error('[Skill Cleanup] Failed to run cascading deletes:', error);
        }
    }
});
