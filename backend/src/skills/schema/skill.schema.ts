import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'skills' })
export class Skill extends Document {
    @Prop({ required: true })
    name!: string;

    @Prop({ required: true, enum: ['technique', 'comportementale', 'transverse', 'opérationnelle'] })
    type!: string;

    @Prop({ enum: ['draft', 'submitted', 'validated'], default: 'draft' })
    etat!: string;

    @Prop()
    description!: string;

    @Prop()
    category!: string;

    @Prop({ default: 0 })
    auto_eval!: number;

    @Prop({ default: 0 })
    hierarchie_eval!: number;
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
