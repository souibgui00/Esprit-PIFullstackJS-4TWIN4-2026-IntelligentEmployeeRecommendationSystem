import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Patch,
  Req,
  Query,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto, UpdateActivityDto } from './dto/activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AuditService } from '../common/audit/audit.service';

@Controller('api/activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly auditService: AuditService,
  ) {}

  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  @Post()
  async create(@Body() createActivityDto: CreateActivityDto, @Req() req: any) {
    const activity = await this.activitiesService.create(
      createActivityDto,
      req.user.userId,
    );
    await this.auditService.logAction({
      action: 'CREATE_ACTIVITY',
      entityType: 'Activity',
      entityId: (activity as any)._id.toString(),
      actorId: req.user.userId,
      newValue: createActivityDto,
    });
    return activity;
  }

  @Get()
  async findAll(@Req() req: any, @Query('limit') limit?: string) {
    const results = await this.activitiesService.findAll(
      req.user.role,
      req.user.userId,
    );
    console.log(
      `[ActivitiesController] Found ${results.length} activities for user ${req.user.userId} (Role: ${req.user.role})`,
    );
    
    if (limit) {
      const limitNum = parseInt(limit, 10);
      return results.slice(0, limitNum);
    }
    return results;
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.HR)
  @Get('pending')
  findPending() {
    return this.activitiesService.findPending();
  }

  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  @Get('recommendation-eligible')
  findRecommendationEligible(
    @Query('includeCompleted') includeCompleted?: string,
  ) {
    const include = String(includeCompleted || '').toLowerCase() === 'true';
    return this.activitiesService.findRecommendationEligible(include);
  }

  @Post('extract-skills')
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  async extractSkills(@Body() body: { description: string; title: string }) {
    return this.activitiesService.extractSkillsFromDescription(
      body.description,
      body.title,
    );
  }
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE, Role.HR)
  @Get('recommendations/:userId')
  getRecommendations(@Param('userId') userId: string) {
    return this.activitiesService.getRecommendations(userId);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.HR)
  @Post(':activityId/recommendations')
  getRecommendationsForActivityPost(
    @Param('activityId') activityId: string,
    @Body() options: any = {},
  ) {
    return this.activitiesService.getRecommendationsForActivity(
      activityId,
      options,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.HR)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
    @Req() req: any,
  ) {
    const before = await this.activitiesService.findOne(id);
    const updated = await this.activitiesService.update(id, updateActivityDto);
    await this.auditService.logAction({
      action: 'UPDATE_ACTIVITY',
      entityType: 'Activity',
      entityId: id,
      actorId: req.user.userId,
      oldValue: before,
      newValue: updateActivityDto,
    });
    return updated;
  }

  @Roles(Role.ADMIN, Role.HR)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const before = await this.activitiesService.findOne(id);
    const result = await this.activitiesService.remove(id);
    await this.auditService.logAction({
      action: 'DELETE_ACTIVITY',
      entityType: 'Activity',
      entityId: id,
      actorId: req.user.userId,
      oldValue: before,
    });
    return result;
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  @Patch(':id/enroll')
  enroll(@Param('id') id: string) {
    return this.activitiesService.enroll(id);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  @Patch(':id/unenroll')
  unenroll(@Param('id') id: string) {
    return this.activitiesService.unenroll(id);
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.HR)
  @Patch(':id/approve')
  async approve(@Param('id') id: string, @Req() req: any) {
    const activity = await this.activitiesService.approve(id, req.user.userId);
    await this.auditService.logAction({
      action: 'APPROVE_ACTIVITY',
      entityType: 'Activity',
      entityId: id,
      actorId: req.user.userId,
      metadata: { approvedAt: new Date().toISOString() },
    });
    return activity;
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.HR)
  @Patch(':id/reject')
  async reject(
    @Param('id') id: string,
    @Req() req: any,
    @Body('reason') reason: string,
  ) {
    const activity = await this.activitiesService.reject(
      id,
      req.user.userId,
      reason,
    );
    await this.auditService.logAction({
      action: 'REJECT_ACTIVITY',
      entityType: 'Activity',
      entityId: id,
      actorId: req.user.userId,
      metadata: { reason, rejectedAt: new Date().toISOString() },
    });
    return activity;
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.HR)
  @Get(':activityId/recommendations')
  getRecommendationsForActivity(
    @Param('activityId') activityId: string,
    @Query('prompt') prompt?: string,
  ) {
    return this.activitiesService.getRecommendationsForActivity(
      activityId,
      prompt,
    );
  }
}
