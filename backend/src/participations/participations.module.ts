import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParticipationsService } from './participations.service';
import { ParticipationsController } from './participations.controller';
import { ParticipationSchedulerService } from './participation-scheduler.service';
import {
  Participation,
  ParticipationSchema,
} from './schema/participation.schema';
import { ActivitiesModule } from '../activities/activities.module';
import { UsersModule } from '../users/users.module';
import { ScoringModule } from '../scoring/scoring.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SkillsModule } from '../skills/skills.module';
import { EvaluationsModule } from '../evaluations/evaluations.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Participation.name, schema: ParticipationSchema },
    ]),
    ActivitiesModule,
    UsersModule,
    ScoringModule,
    NotificationsModule,
    SkillsModule,
    EvaluationsModule,
  ],
  controllers: [ParticipationsController],
  providers: [ParticipationsService, ParticipationSchedulerService],
  exports: [ParticipationsService],
})
export class ParticipationsModule {}
