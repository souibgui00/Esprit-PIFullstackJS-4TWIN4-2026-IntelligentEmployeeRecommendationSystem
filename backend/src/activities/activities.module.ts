import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { Activity, ActivitySchema } from './schema/activity.schema';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ScoringModule } from '../scoring/scoring.module';
import { ParticipationSchema } from '../participations/schema/participation.schema';
import { ActivityRequestModule } from './activity-request.module';
import { AuditModule } from '../common/audit/audit.module';

@Module({
    imports: [
        HttpModule,
        MongooseModule.forFeature([
            { name: Activity.name, schema: ActivitySchema },
            { name: 'Participation', schema: ParticipationSchema },
        ]),
        UsersModule,
        NotificationsModule,
        ScoringModule,
        ActivityRequestModule,
        AuditModule,
    ],
    controllers: [ActivitiesController],
    providers: [ActivitiesService],
    exports: [ActivitiesService],
})
export class ActivitiesModule { }
