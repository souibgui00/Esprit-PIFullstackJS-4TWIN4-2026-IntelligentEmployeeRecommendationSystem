import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ParticipationsService } from './participations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('participations')
@UseGuards(JwtAuthGuard)
export class ParticipationsController {
  constructor(private readonly participationsService: ParticipationsService) {}

  @Get()
  async getAllParticipations() {
    return this.participationsService.findAll();
  }

  @Get('me')
  async getMyParticipations(@Req() req: any) {
    return this.participationsService.findByUser(req.user.userId);
  }

  @Get('user/:userId')
  async getUserParticipations(@Param('userId') userId: string) {
    return this.participationsService.findByUser(userId);
  }

  @Get(':activityId/organizer-panel')
  async getOrganizerPanel(@Param('activityId') activityId: string) {
    return this.participationsService.getOrganizerPanel(activityId);
  }

  @Post(':activityId')
  async enroll(
    @Req() req: any,
    @Param('activityId') activityId: string,
    @Body('userId') userId?: string,
  ) {
    // If userId is provided in body, use it (admin/manager action)
    // Otherwise use the authenticated user's ID
    const targetUserId = userId || req.user.userId;
    return this.participationsService.create(targetUserId, activityId);
  }

  @Patch(':activityId/progress')
  async updateProgress(
    @Req() req: any,
    @Param('activityId') activityId: string,
    @Body('progress') progress: number,
    @Body('feedback') feedback?: number,
  ) {
    return this.participationsService.updateProgress(
      req.user.userId,
      activityId,
      progress,
      feedback,
    );
  }

  @Delete(':activityId')
  @UseGuards(JwtAuthGuard)
  async unenroll(
    @Req() req: any,
    @Param('activityId') activityId: string,
    @Body('userId') userId?: string,
  ) {
    const targetUserId = userId || req.user.userId;
    return this.participationsService.remove(targetUserId, activityId);
  }

  @Patch(':participationId/mark-complete-employee')
  async markCompleteByEmployee(
    @Req() req: any,
    @Param('participationId') participationId: string,
  ) {
    return this.participationsService.markCompleteByEmployee(
      participationId,
      req.user.userId,
    );
  }

  @Get(':participationId/mark-complete-employee')
  async markCompleteByEmployeeGet(
    @Req() req: any,
    @Param('participationId') participationId: string,
  ) {
    return this.markCompleteByEmployee(req, participationId);
  }

  @Get('manager/pending-validations')
  async getPendingValidations(@Req() req: any) {
    return this.participationsService.getPendingManagerValidations(
      req.user.userId,
    );
  }

  @Post(':activityId/organizer-report')
  async submitOrganizerReport(
    @Param('activityId') activityId: string,
    @Body('report') report: any[],
  ) {
    return this.participationsService.submitOrganizerReport(activityId, report);
  }

  @Get(':participationId/validation-report')
  async getValidationReportData(
    @Param('participationId') participationId: string,
  ) {
    return this.participationsService.getValidationReportData(participationId);
  }

  @Post(':participationId/validate-report')
  async submitManagerValidation(
    @Req() req: any,
    @Param('participationId') participationId: string,
    @Body('isApproved') isApproved: boolean,
    @Body('rating') rating: number,
    @Body('comment') comment: string,
    @Body('skillAssessments') skillAssessments: Record<string, boolean>,
  ) {
    return this.participationsService.submitManagerValidation(
      participationId,
      req.user.userId,
      isApproved,
      rating,
      comment,
      skillAssessments || {},
    );
  }
}
