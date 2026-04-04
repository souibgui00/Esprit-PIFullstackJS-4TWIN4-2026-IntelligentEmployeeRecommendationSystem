import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { PrioritizationService } from '../prioritization/prioritization.service';
import { RecommendationModelService } from './recommendation-model.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('api/scoring')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScoringController {
  constructor(
    private scoringService: ScoringService,
    private prioritizationService: PrioritizationService,
    private recommendationModelService: RecommendationModelService,
  ) {}

  // ─── Scoring Endpoints ─────────────────────────────────────────────────────────

  /**
   * GET /api/scoring/skill/:userId/:skillId
   * Calculate individual skill score for an employee
   */
  @Get('skill/:userId/:skillId')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getSkillScore(
    @Param('userId') userId: string,
    @Param('skillId') skillId: string,
  ) {
    try {
      const score = await this.scoringService.calculateSkillScore(userId, skillId);
      return {
        success: true,
        userId,
        skillId,
        score,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /api/scoring/employee/:userId/skills
   * Get all skill scores for an employee with metadata
   */
  @Get('employee/:userId/skills')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getEmployeeSkillScores(@Param('userId') userId: string) {
    try {
      const skillScores = await this.scoringService.getEmployeeSkillScores(userId);
      return {
        success: true,
        userId,
        totalSkills: skillScores.length,
        skillScores,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /api/scoring/activity/:userId/:activityId
   * Calculate global activity score for an employee
   */
  @Get('activity/:userId/:activityId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async getGlobalActivityScore(
    @Param('userId') userId: string,
    @Param('activityId') activityId: string,
  ) {
    try {
      const score = await this.scoringService.calculateGlobalActivityScore(userId, activityId);
      const matchPercentage = await this.scoringService.getActivityMatchPercentage(userId, activityId);
      
      return {
        success: true,
        userId,
        activityId,
        globalActivityScore: score,
        matchPercentage,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * POST /api/scoring/participation/update
   * Automatically update skill scores after activity participation
   */
  @Post('participation/update')
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateScoresAfterParticipation(
    @Body() body: { userId: string; activityId: string; feedbackRating: number },
  ) {
    try {
      const result = await this.scoringService.updateSkoresAfterParticipation(
        body.userId,
        body.activityId,
        body.feedbackRating,
      );

      return {
        success: true,
        message: 'Scores updated successfully after participation',
        result,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /api/scoring/analytics/:userId
   * Get score analytics for an employee
   */
  @Get('analytics/:userId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async getScoreAnalytics(@Param('userId') userId: string) {
    try {
      const analytics = await this.scoringService.getScoreAnalytics(userId);
      return {
        success: true,
        analytics,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * POST /api/scoring/compare
   * Compare skill scores of multiple employees
   */
  @Post('compare')
  @Roles(Role.ADMIN, Role.MANAGER)
  async compareEmployeeScores(@Body() body: { userIds: string[] }) {
    try {
      const comparisons = await this.scoringService.compareEmployeeScores(body.userIds);
      return {
        success: true,
        comparisons,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ─── Prioritization Endpoints ──────────────────────────────────────────────────

  /**
   * GET /api/scoring/activity/:activityId/recommendations
   * Get recommended employees for an activity based on context profile
   */
  @Get('activity/:activityId/recommendations')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getRecommendedEmployees(
    @Param('activityId') activityId: string,
    @Query('context') context: 'low' | 'medium' | 'expert' = 'medium',
    @Query('limit') limit: number = 10,
  ) {
    try {
      const recommendations = await this.prioritizationService.getRecommendedEmployeesForActivity(
        activityId,
        context,
        limit,
      );

      return {
        success: true,
        activityId,
        context,
        totalRecommendations: recommendations.length,
        recommendations,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * PUT /api/scoring/activity/:activityId/weight-skills
   * Weight skills based on activity importance
   */
  @Put('activity/:activityId/weight-skills')
  @Roles(Role.ADMIN, Role.MANAGER)
  async weightSkillsByImportance(
    @Param('activityId') activityId: string,
    @Body() body: { importance: number },
  ) {
    try {
      const result = await this.prioritizationService.weightSkillsByActivityImportance(
        activityId,
        body.importance,
      );

      return {
        success: true,
        message: 'Skills weighted by activity importance',
        result,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /api/scoring/activity/:activityId/skill-gaps/:userId
   * Identify skill gaps for an employee relative to activity requirements
   */
  @Get('activity/:activityId/skill-gaps/:userId')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getSkillGaps(
    @Param('activityId') activityId: string,
    @Param('userId') userId: string,
  ) {
    try {
      const gaps = await this.prioritizationService.identifySkillGaps(userId, activityId);
      return {
        success: true,
        userId,
        activityId,
        skillGapsCount: gaps.length,
        skillGaps: gaps,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /api/scoring/activity/:activityId/skill-levels
   * Get employees grouped by skill level for an activity
   */
  @Get('activity/:activityId/skill-levels')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getEmployeesBySkillLevel(@Param('activityId') activityId: string) {
    try {
      const grouped = await this.prioritizationService.getEmployeesBySkillLevel(activityId);
      return {
        success: true,
        activityId,
        groupedBySkillLevel: grouped,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /api/scoring/activity/:activityId/importance-suggestion
   * Get activity importance recommendation based on required skills
   */
  @Get('activity/:activityId/importance-suggestion')
  @Roles(Role.ADMIN, Role.MANAGER)
  async suggestActivityImportance(@Param('activityId') activityId: string) {
    try {
      const suggestion = await this.prioritizationService.suggestActivityImportance(activityId);
      return {
        success: true,
        suggestion,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ─── Hybrid Recommendation Endpoints ───────────────────────────────────────

  /**
   * GET /api/scoring/predict/:userId/:activityId
   * Predict compatibility score using the hybrid model
   */
  @Get('predict/:userId/:activityId')
  @Roles(Role.ADMIN, Role.MANAGER, Role.EMPLOYEE)
  async predictCompatibility(
    @Param('userId') userId: string,
    @Param('activityId') activityId: string,
  ) {
    try {
      const score = await this.recommendationModelService.predictScore(userId, activityId);
      return {
        success: true,
        userId,
        activityId,
        score,
        scorePercent: Math.round(score * 100),
        label:
          score >= 0.85 ? 'Top Pick'
          : score >= 0.70 ? 'Highly Recommended'
          : score >= 0.50 ? 'Recommended'
          : score >= 0.05 ? 'Consider'
          : 'Not Relevant',
      };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * GET /api/scoring/breakdown/:userId/:activityId
   * Full breakdown of each hybrid model component for transparency
   */
  @Get('breakdown/:userId/:activityId')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getScoreBreakdown(
    @Param('userId') userId: string,
    @Param('activityId') activityId: string,
  ) {
    try {
      const breakdown = await this.recommendationModelService.getScoreBreakdown(userId, activityId);
      return { success: true, userId, activityId, ...breakdown };
    } catch (error: any) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
