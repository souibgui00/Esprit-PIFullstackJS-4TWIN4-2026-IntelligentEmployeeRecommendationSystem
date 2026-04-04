import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ParticipationsService } from './participations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('participations')
@UseGuards(JwtAuthGuard)
export class ParticipationsController {
    constructor(private readonly participationsService: ParticipationsService) { }

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

    @Post(':activityId')
    async enroll(
      @Req() req: any, 
      @Param('activityId') activityId: string,
      @Body('userId') userId?: string
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
        return this.participationsService.updateProgress(req.user.userId, activityId, progress, feedback);
    }

    @Delete(':activityId')
    @UseGuards(JwtAuthGuard)
    async unenroll(
        @Req() req: any, 
        @Param('activityId') activityId: string,
        @Body('userId') userId?: string
    ) {
        const targetUserId = userId || req.user.userId;
        return this.participationsService.remove(targetUserId, activityId);
    }
}
