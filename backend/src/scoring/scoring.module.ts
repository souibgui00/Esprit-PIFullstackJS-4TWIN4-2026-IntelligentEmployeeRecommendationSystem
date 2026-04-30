import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScoringService } from './scoring.service';
import { ScoringController } from './scoring.controller';
import { PrioritizationService } from '../prioritization/prioritization.service';
import { RecommendationModelService } from './recommendation-model.service';
import { User, UserSchema } from '../users/schema/user.schema';
import { Activity, ActivitySchema } from '../activities/schema/activity.schema';
import { ParticipationSchema } from '../participations/schema/participation.schema';
import { SkillSchema } from '../skills/schema/skill.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: 'Activity', schema: ActivitySchema },
      { name: 'Participation', schema: ParticipationSchema },
      { name: 'Skill', schema: SkillSchema },
    ]),
  ],
  controllers: [ScoringController],
  providers: [
    ScoringService,
    PrioritizationService,
    RecommendationModelService,
  ],
  exports: [ScoringService, PrioritizationService, RecommendationModelService],
})
export class ScoringModule {}
