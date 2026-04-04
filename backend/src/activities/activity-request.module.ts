import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityRequest, ActivityRequestSchema } from './activity-request.schema';
import { Activity, ActivitySchema } from './schema/activity.schema';
import { ActivityRequestService } from './activity-request.service';
import { ActivityRequestController } from './activity-request.controller';
import { AuditModule } from '../common/audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActivityRequest.name, schema: ActivityRequestSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
    AuditModule,
  ],
  controllers: [ActivityRequestController],
  providers: [ActivityRequestService],
  exports: [ActivityRequestService],
})
export class ActivityRequestModule {}
