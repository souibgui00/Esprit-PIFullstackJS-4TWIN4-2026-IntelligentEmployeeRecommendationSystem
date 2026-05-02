import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActivityRequest } from './activity-request.schema';
import { Activity } from './schema/activity.schema';
import { CreateActivityRequestDto } from './dto/create-activity-request.dto';
import { ReviewActivityRequestDto } from './dto/review-activity-request.dto';
import { AuditService } from '../common/audit/audit.service';

@Injectable()
export class ActivityRequestService {
  constructor(
    @InjectModel(ActivityRequest.name)
    private activityRequestModel: Model<ActivityRequest>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateActivityRequestDto, userId: string) {
    const created = await this.activityRequestModel.create({
      ...dto,
      status: 'PENDING',
      requestedBy: userId,
    });
    await this.auditService.logAction({
      action: 'CREATE_REQUEST',
      entityType: 'ActivityRequest',
      entityId: created._id.toString(),
      actorId: userId,
      newValue: created.toObject(),
    });
    return created;
  }

  async findAllPending() {
    return this.activityRequestModel.find({ status: 'PENDING' }).lean();
  }

  async review(id: string, dto: ReviewActivityRequestDto, reviewerId: string) {
    const req = await this.activityRequestModel.findById(id);
    if (!req) throw new NotFoundException('Request not found');
    if (req.status !== 'PENDING')
      throw new ForbiddenException('Already reviewed');
    req.status = dto.status;
    req.reviewedBy = reviewerId;
    req.reviewedAt = new Date();
    if (dto.status === 'REJECTED') req.rejectionReason = dto.rejectionReason;
    await req.save();

    // Create Activity when approved
    if (dto.status === 'APPROVED') {
      const activity = await this.activityModel.create({
        title: req.title,
        description: req.description,
        createdBy: req.requestedBy,
        type: 'training', // Default type
        date: new Date().toISOString().split('T')[0], // Today's date
        duration: '2 hours', // Default duration
        capacity: req.seatCount,
        status: 'open',
        skillsCovered: req.requiredSkills,
        level: 'beginner',
        workflowStatus: 'approved',
        approvedBy: reviewerId,
        approvedAt: new Date(),
      });

      // Log activity creation
      await this.auditService.logAction({
        action: 'CREATE_ACTIVITY_FROM_REQUEST',
        entityType: 'Activity',
        entityId: activity._id.toString(),
        actorId: reviewerId,
        newValue: activity.toObject(),
        metadata: { activityRequestId: req._id.toString() },
      });
    }

    await this.auditService.logAction({
      action: dto.status === 'APPROVED' ? 'APPROVE_REQUEST' : 'REJECT_REQUEST',
      entityType: 'ActivityRequest',
      entityId: req._id.toString(),
      actorId: reviewerId,
      oldValue: req.toObject(),
      newValue: req.toObject(),
      metadata: { rejectionReason: dto.rejectionReason },
    });
    return req;
  }
}
