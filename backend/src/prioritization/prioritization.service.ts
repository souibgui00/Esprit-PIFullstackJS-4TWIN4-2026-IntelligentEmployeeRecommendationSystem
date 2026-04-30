import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/schema/user.schema';
import { Role } from '../common/enums/role.enum';
import { Activity } from '../activities/schema/activity.schema';
import { ScoringService } from '../scoring/scoring.service';

type CandidateSummary = {
  employeeId: Types.ObjectId;
  name: string;
  email: string;
  rank: string;
  globalScore: number;
  matchPercentage: number;
};

/**
 * Optimization and Contextual Prioritization Module
 *
 * Provides intelligent employee selection based on:
 * - Skill weighting for activity importance
 * - Context-based profiles (low, medium, expert)
 * - Tie and conflict resolution strategies
 */
@Injectable()
export class PrioritizationService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel('Activity')
    private activityModel: Model<Activity>,
    @InjectModel('Participation')
    private participationModel: Model<any>,
    @InjectModel('Skill')
    private skillModel: Model<any>,
    private scoringService: ScoringService,
  ) {}

  /**
   * ⚡ Batch-fetch skills for all candidate IDs in ONE query.
   * Returns a Map<userId, skills[]> for O(1) lookup during gap calculation.
   * This replaces N×2 individual DB queries in ActivitiesService.
   */
  async batchFetchCandidateSkills(
    candidateIds: string[],
  ): Promise<Map<string, any[]>> {
    const objectIds = candidateIds.map(
      (id) => new (require('mongoose').Types.ObjectId)(id),
    );

    const users = (await this.userModel
      .find({ _id: { $in: objectIds } })
      .select('skills')
      .lean()) as any[];

    const map = new Map<string, any[]>();
    for (const user of users) {
      map.set(user._id.toString(), user.skills || []);
    }
    return map;
  }

  /**
   * Prioritization Context Profiles:
   * - LOW: Select broad range of employees, learning focus
   * - MEDIUM: Balanced selection, equal opportunity
   * - EXPERT: Select top performers only, high standards
   */

  /**
   * Get recommended employees for an activity based on context profile
   *
   * @param activityId - The activity to find employees for
   * @param context - Selection context: 'low', 'medium', or 'expert'
   * @param limit - Maximum number of recommendations
   * @returns Sorted list of candidates with scores and reasoning
   */
  async getRecommendedEmployeesForActivity(
    activityId: string,
    context: 'low' | 'medium' | 'expert' = 'medium',
    limit: number = 10,
  ): Promise<any[]> {
    const activity = await this.activityModel.findById(activityId);
    if (!activity) throw new NotFoundException('Activity not found');

    // Get all employees
    const employees = await this.userModel.find({ role: Role.EMPLOYEE });
    if (employees.length === 0) return [];

    // Calculate scores and rankings for each employee
    const candidates = [];

    for (const employee of employees) {
      const globalScore =
        await this.scoringService.calculateGlobalActivityScore(
          employee._id.toString(),
          activityId,
        );

      const matchPercentage =
        await this.scoringService.getActivityMatchPercentage(
          employee._id.toString(),
          activityId,
        );

      const skillGaps = await this.identifySkillGaps(
        employee._id.toString(),
        activityId,
      );

      candidates.push({
        employeeId: employee._id,
        name: employee.name,
        email: employee.email,
        rank: employee.rank || 'Junior',
        rankScore: employee.rankScore || 0,
        globalScore,
        matchPercentage,
        skillGaps,
        contextScore: 0, // Will be calculated per context
      });
    }

    // Filter and rank based on context profile
    const contextualResults = this.applyContextProfile(candidates, context);

    // Handle ties if needed
    const resolved = this.resolveTies(contextualResults);

    return resolved.slice(0, limit);
  }

  /**
   * Weight skills based on activity importance
   * Higher importance = higher weight multiplier
   *
   * @param activityId - The activity to weight skills for
   * @param importance - Importance level: 1-10
   * @returns Updated activity with weighted skills
   */
  async weightSkillsByActivityImportance(
    activityId: string,
    importance: number,
  ): Promise<any> {
    if (importance < 1 || importance > 10) {
      throw new BadRequestException('Importance must be between 1 and 10');
    }

    const activity = await this.activityModel.findById(activityId);
    if (!activity) throw new NotFoundException('Activity not found');

    // Calculate weight multiplier based on importance
    // Importance 1-3: Light multiplier (0.7-0.9)
    // Importance 4-7: Normal multiplier (1.0-1.3)
    // Importance 8-10: Heavy multiplier (1.4-1.6)
    const multiplier =
      importance < 4
        ? 0.7 + (importance - 1) * 0.1
        : importance < 8
          ? 1.0 + (importance - 4) * 0.075
          : 1.4 + (importance - 8) * 0.033;

    // Apply multiplier to existing weights
    const updatedSkills = activity.requiredSkills.map((skill) => ({
      skillId: skill.skillId,
      weight: Math.min(skill.weight * multiplier, 2.0), // Cap at 2.0
    }));

    const updated = await this.activityModel.findByIdAndUpdate(
      activityId,
      { requiredSkills: updatedSkills },
      { new: true },
    );

    return {
      activityId,
      importance,
      weightMultiplier: multiplier,
      updatedSkills,
      activity: updated,
    };
  }

  /**
   * Identify skill gaps for an employee relative to activity requirements
   */
  async identifySkillGaps(userId: string, activityId: string): Promise<any[]> {
    // Use raw MongoDB queries — bypass Mongoose type casting
    const db = this.userModel.db.db as any;
    const user = await db
      .collection('users')
      .findOne({ _id: new (require('mongoose').Types.ObjectId)(userId) });
    const activity = await db
      .collection('activities')
      .findOne({ _id: new (require('mongoose').Types.ObjectId)(activityId) });

    if (!user) throw new NotFoundException('User not found');
    if (!activity) throw new NotFoundException('Activity not found');

    // Build user skill map — key = skillId as plain string
    const userSkillMap = new Map<string, any>();
    for (const s of user.skills || []) {
      const id = s.skillId?.toString().trim();
      if (id) userSkillMap.set(id, s);
    }

    const gaps = [];
    const levelOrder: Record<string, number> = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4,
    };

    for (const req of activity.requiredSkills || []) {
      const reqSkillId = req.skillId?.toString().trim();
      if (!reqSkillId) continue;

      // Fetch skill name
      const skillDoc = await db
        .collection('skills')
        .findOne({ _id: reqSkillId });
      const skillName = skillDoc?.name ?? reqSkillId;

      const userSkill = userSkillMap.get(reqSkillId);

      if (!userSkill) {
        gaps.push({
          skillId: reqSkillId,
          skillName,
          skillType: 'missing',
          requiredWeight: req.weight ?? 0.5,
          gap: 'not_acquired',
        });
      } else {
        const userLevel = levelOrder[userSkill.level] ?? 1;
        const requiredLevel = levelOrder[req.requiredLevel] ?? 1;
        if (userLevel < requiredLevel) {
          gaps.push({
            skillId: reqSkillId,
            skillName,
            skillType: 'insufficient_level',
            currentLevel: userSkill.level,
            requiredLevel: req.requiredLevel,
            requiredWeight: req.weight ?? 0.5,
            gap: 'level_mismatch',
          });
        }
      }
    }

    return gaps;
  }
  /**
   * Get employees grouped by skill level for an activity
   * Useful for understanding team capacity
   */
  async getEmployeesBySkillLevel(activityId: string): Promise<any> {
    const activity = await this.activityModel.findById(activityId);
    if (!activity) throw new NotFoundException('Activity not found');

    const employees = await this.userModel.find({ role: Role.EMPLOYEE });

    const grouped: Record<string, CandidateSummary[]> = {
      expert: [],
      advanced: [],
      intermediate: [],
      beginner: [],
      insufficient: [],
    };

    for (const employee of employees) {
      const globalScore =
        await this.scoringService.calculateGlobalActivityScore(
          employee._id.toString(),
          activityId,
        );

      const matchPercentage =
        await this.scoringService.getActivityMatchPercentage(
          employee._id.toString(),
          activityId,
        );

      const candidate = {
        employeeId: employee._id,
        name: employee.name,
        email: employee.email,
        rank: employee.rank,
        globalScore,
        matchPercentage,
      };

      // Classify by score
      if (globalScore >= 85 && matchPercentage === 100) {
        grouped.expert.push(candidate);
      } else if (globalScore >= 65 && matchPercentage >= 80) {
        grouped.advanced.push(candidate);
      } else if (globalScore >= 45 && matchPercentage >= 60) {
        grouped.intermediate.push(candidate);
      } else if (globalScore >= 25 || matchPercentage >= 40) {
        grouped.beginner.push(candidate);
      } else {
        grouped.insufficient.push(candidate);
      }
    }

    return grouped;
  }

  /**
   * Resolve conflicts when multiple employees have the same score
   * Priority: Rank > Experience > Participation History
   */
  resolveTies(candidates: any[]): any[] {
    const rankOrder = { Expert: 4, Senior: 3, Mid: 2, Junior: 1 };

    return candidates.sort((a, b) => {
      // First: Sort by context score
      if (b.contextScore !== a.contextScore) {
        return b.contextScore - a.contextScore;
      }

      // Second: Sort by rank
      const rankA = rankOrder[a.rank as keyof typeof rankOrder] || 0;
      const rankB = rankOrder[b.rank as keyof typeof rankOrder] || 0;
      if (rankB !== rankA) {
        return rankB - rankA;
      }

      // Third: Sort by rank score (overall skill score)
      if (b.rankScore !== a.rankScore) {
        return b.rankScore - a.rankScore;
      }

      // Fourth: Sort by global score for this activity
      if (b.globalScore !== a.globalScore) {
        return b.globalScore - a.globalScore;
      }

      // Fifth: Sort by name (alphabetical, tiebreaker)
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Apply INTENT-AWARE scoring to candidate pool.
   *
   * development → reward skill GAPS (who NEEDS this activity)
   * performance → reward skill MATCH (who CAN perform in this activity)
   * balanced    → reward mid-range candidates (who GROWS most from this activity)
   */
  applyIntentAwareScoring(candidates: any[], activity: any): any[] {
    const intent = activity.intent || this.inferIntent(activity.type);
    const level = activity.level || 'beginner';
    const totalRequired = (activity.requiredSkills || []).length;

    return candidates.map((c) => {
      let contextScore = 0;
      let reason = '';

      if (intent === 'development') {
        // Reward candidates who LACK the skills: more gaps = higher priority
        // Also reward junior/mid ranks for beginner activities, senior for advanced
        const gapRatio =
          totalRequired > 0
            ? c.skillGaps.length / totalRequired
            : c.globalScore < 40
              ? 1
              : 0.2;
        const progressionBonus = this.getProgressionPotential(c.rank, level);
        contextScore = gapRatio * 70 + progressionBonus * 0.3;
        reason =
          c.skillGaps.length > 0
            ? `Needs development in: ${c.skillGaps
                .slice(0, 2)
                .map((g: any) => g.skillName)
                .join(', ')}`
            : 'Profile suggests learning potential for this activity';
      } else if (intent === 'performance') {
        // Reward candidates who HAVE the skills: high score + high match
        contextScore = c.globalScore * 0.65 + c.matchPercentage * 0.35;
        reason =
          c.skillGaps.length === 0
            ? 'Fully qualified — all required skills met'
            : `Strong match with ${totalRequired - c.skillGaps.length}/${totalRequired} required skills`;
      } else {
        // Balanced: prefer candidates in the mid-range (not too weak, not over-qualified)
        const midBonus = this.getMidRangeBonus(c.globalScore);
        contextScore = midBonus * 0.5 + c.globalScore * 0.5;
        reason = 'Balanced profile — good development/contribution mix';
      }

      return { ...c, contextScore, intent, recommendation_reason: reason };
    });
  }

  /** Infer intent from activity type when not explicitly set */
  inferIntent(type: string): string {
    if (['training', 'workshop'].includes(type)) return 'development';
    if (['mentoring', 'webinar'].includes(type)) return 'balanced';
    return 'balanced';
  }

  /**
   * How well does an employee's rank align with the activity level?
   * Junior + beginner activity = 100 (perfect fit for development)
   * Senior + beginner activity = 25 (over-qualified, someone else needs it more)
   */
  private getProgressionPotential(rank: string, activityLevel: string): number {
    const rankScore = { Junior: 1, Mid: 2, Senior: 3, Expert: 4 }[rank] ?? 1;
    const levelScore =
      { beginner: 1, intermediate: 2, advanced: 3 }[activityLevel] ?? 1;
    const diff = Math.abs(rankScore - levelScore);
    return Math.max(0, 100 - diff * 25);
  }

  /**
   * Bell-curve bonus centred at globalScore=50.
   * Employees at 50% benefit most from a balanced activity.
   * Extremes (very high or very low) score lower.
   */
  private getMidRangeBonus(globalScore: number): number {
    const deviation = Math.abs(globalScore - 50);
    return Math.max(0, 100 - deviation * 1.5);
  }

  /**
   * @deprecated Use applyIntentAwareScoring instead.
   * Kept for backward compatibility with any direct calls.
   */
  private applyContextProfile(
    candidates: any[],
    context: 'low' | 'medium' | 'expert',
  ): any[] {
    // Map old context names to new intent names
    const intentMap: Record<string, string> = {
      low: 'development',
      medium: 'balanced',
      expert: 'performance',
    };
    const fakeActivity = {
      intent: intentMap[context] || 'balanced',
      requiredSkills: [],
      level: 'intermediate',
    };
    return this.applyIntentAwareScoring(candidates, fakeActivity);
  }

  /**
   * Get activity importance recommendation based on required skills
   * Helps determine the overall complexity and stakes of the activity
   */
  async suggestActivityImportance(activityId: string): Promise<any> {
    const activity = await this.activityModel
      .findById(activityId)
      .populate('requiredSkills.skillId');
    if (!activity) throw new NotFoundException('Activity not found');

    const requiredSkills = activity.requiredSkills || [];

    // Importance factors
    let importanceScore = 0;

    // Factor 1: Number of required skills
    if (requiredSkills.length >= 5) importanceScore += 3;
    else if (requiredSkills.length >= 3) importanceScore += 2;
    else if (requiredSkills.length >= 1) importanceScore += 1;

    // Factor 2: Average skill weight
    const avgWeight =
      requiredSkills.reduce((sum, req) => sum + (req.weight || 0.5), 0) /
      Math.max(requiredSkills.length, 1);
    if (avgWeight >= 1.5) importanceScore += 3;
    else if (avgWeight >= 1.0) importanceScore += 2;
    else importanceScore += 1;

    // Factor 3: Activity level and type
    if (activity.level === 'advanced') importanceScore += 2;
    else if (activity.level === 'intermediate') importanceScore += 1;

    if (['workshop', 'mentoring'].includes(activity.type)) importanceScore += 1;

    // Cap at 10
    importanceScore = Math.min(importanceScore + 1, 10); // +1 for minimum

    return {
      activityId,
      activityTitle: activity.title,
      suggestedImportance: importanceScore,
      factors: {
        requiredSkillsCount: requiredSkills.length,
        averageWeight: Math.round(avgWeight * 100) / 100,
        level: activity.level,
        type: activity.type,
      },
      reasoning: this.getImportanceReasoning(
        importanceScore,
        requiredSkills.length,
        avgWeight,
        activity.level,
      ),
    };
  }

  /**
   * Generate human-readable reasoning for importance suggestion
   */
  private getImportanceReasoning(
    score: number,
    skillCount: number,
    avgWeight: number,
    level: string,
  ): string {
    const factors = [];

    if (skillCount >= 5) factors.push(`requires ${skillCount} skills`);
    if (avgWeight >= 1.5) factors.push('high average skill weight');
    if (level === 'advanced') factors.push('advanced difficulty level');

    if (factors.length === 0) factors.push('relatively simple activity');

    return `Suggested importance ${score}/10: ${factors.join(', ')}`;
  }
}
