import { Controller, Post, UseGuards } from '@nestjs/common';
import { SkillDecayService } from './skill-decay.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

/**
 * Admin-only endpoint to manually trigger the Skill Decay Engine.
 * Useful for demos and testing without waiting for the weekly cron.
 *
 * POST /api/skill-decay/trigger
 */
@Controller('api/skill-decay')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SkillDecayController {
  constructor(private readonly skillDecayService: SkillDecayService) {}

  @Post('trigger')
  @Roles(Role.ADMIN)
  async triggerDecay() {
    const result = await this.skillDecayService.triggerManualDecay();
    return {
      success: true,
      message: 'Skill decay engine executed successfully.',
      ...result,
    };
  }
}
