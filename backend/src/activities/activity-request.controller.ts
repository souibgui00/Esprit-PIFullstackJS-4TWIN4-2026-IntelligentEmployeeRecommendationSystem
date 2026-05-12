import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Patch,
  UnauthorizedException,
} from '@nestjs/common';
import { ActivityRequestService } from './activity-request.service';
import { CreateActivityRequestDto } from './dto/create-activity-request.dto';
import { ReviewActivityRequestDto } from './dto/review-activity-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('activity-requests')
@UseGuards(JwtAuthGuard)
export class ActivityRequestController {
  constructor(private readonly service: ActivityRequestService) {}

  @Post()
  async create(@Body() dto: CreateActivityRequestDto, @Request() req: any) {
    const userId = req.user?.id || req.user?.userId;
    if (!userId)
      throw new UnauthorizedException('User ID not found in request');
    return this.service.create(dto, userId);
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('HR')
  @Get('pending')
  async findAllPending() {
    return this.service.findAllPending();
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('HR')
  @Patch(':id/review')
  async review(
    @Param('id') id: string,
    @Body() dto: ReviewActivityRequestDto,
    @Request() req: any,
  ) {
    const reviewerId = req.user?.id || req.user?.userId;
    if (!reviewerId)
      throw new UnauthorizedException('User ID not found in request');
    return this.service.review(id, dto, reviewerId);
  }
}
