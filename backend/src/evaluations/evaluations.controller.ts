import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EvaluationsService } from './evaluations.service';

@Controller('evaluations')
@UseGuards(JwtAuthGuard)
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    return this.evaluationsService.create({
      ...body,
      managerId: req.user.userId,
    });
  }

  @Get()
  async getEvaluations(@Req() req: any) {
    const role = req.user.role?.toLowerCase();
    if (role === 'admin' || role === 'hr') {
      return this.evaluationsService.findAll();
    } else if (role === 'manager') {
      return this.evaluationsService.findByManager(req.user.userId);
    } else {
      return this.evaluationsService.findByEmployee(req.user.userId);
    }
  }

  @Get('me')
  async getMyEvaluations(@Req() req: any) {
    return this.evaluationsService.findByEmployee(req.user.userId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.evaluationsService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.evaluationsService.remove(id);
  }
}
