import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/schema/user.schema';
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
    const employees = await this.userModel.find({ role: 'EMPLOYEE' });
    if (employees.length === 0) return [];

    // Calculate scores and rankings for each employee
    const candidates = [];

    for (const employee of employees) {
      const globalScore = await this.scoringService.calculateGlobalActivityScore(
        employee._id.toString(),
        activityId,
      );
      
      const matchPercentage = await this.scoringService.getActivityMatchPercentage(
        employee._id.toString(),
        activityId,
      );

      const skillGaps = await this.identifySkillGaps(employee._id.toString(), activityId);

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
    const multiplier = importance < 4 
      ? 0.7 + (importance - 1) * 0.1
      : importance < 8
      ? 1.0 + (importance - 4) * 0.075
      : 1.4 + (importance - 8) * 0.033;

    // Apply multiplier to existing weights
    const updatedSkills = activity.requiredSkills.map(skill => ({
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
    const user = await this.userModel.findById(userId);
    const activity = await this.activityModel.findById(activityId);

    if (!user) throw new NotFoundException('User not found');
    if (!activity) throw new NotFoundException('Activity not found');

    const gaps = [];
    const requiredSkills = activity.requiredSkills || [];

    for (const req of requiredSkills) {
      const reqSkillId = req.skillId?.toString().replace(/^ObjectId\(['"]?|['"]?\)$/g, '');
      const userSkill = user.skills?.find(s => {
        const sId = s.skillId?.toString().replace(/^ObjectId\(['"]?|['"]?\)$/g, '');
        return sId === reqSkillId;
      });
      const requiredSkillId = req.skillId?.toString();

      // Fetch skill name from DB
      const skillDoc = await this.skillModel.findById(requiredSkillId).lean();
      const skillName = skillDoc?.name || requiredSkillId;

      if (!userSkill) {
        gaps.push({
          skillId: requiredSkillId,
          skillName,
          skillType: 'missing',
          requiredWeight: req.weight || 0.5,
          gap: 'not_acquired',
        });
      } else {
        const levelOrder: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
        const userLevel = levelOrder[userSkill.level] || 1;
        const requiredLevel = levelOrder[req.requiredLevel] || 1;
        if (userLevel < requiredLevel) {
          gaps.push({
            skillId: requiredSkillId,
            skillName,
            skillType: 'insufficient_level',
            currentLevel: userSkill.level,
            requiredLevel: req.requiredLevel,
            requiredWeight: req.weight || 0.5,
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

    const employees = await this.userModel.find({ role: 'EMPLOYEE' });

    const grouped: Record<string, CandidateSummary[]> = {
      expert: [],
      advanced: [],
      intermediate: [],
      beginner: [],
      insufficient: [],
    };

    for (const employee of employees) {
      const globalScore = await this.scoringService.calculateGlobalActivityScore(
        employee._id.toString(),
        activityId,
      );
      
      const matchPercentage = await this.scoringService.getActivityMatchPercentage(
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
    const rankOrder = { 'Expert': 4, 'Senior': 3, 'Mid': 2, 'Junior': 1 };

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
   * Apply context profile rules to filter and score candidates
   */
  private applyContextProfile(candidates: any[], context: 'low' | 'medium' | 'expert'): any[] {
    let filtered = [...candidates];

    switch (context) {
      case 'low':
        // Low profile: Include everyone, learning focus
        // Score based on potential to learn (inverse of skill gaps)
        filtered = filtered.map(c => ({
          ...c,
          contextScore: c.globalScore * 0.5 + (100 - c.skillGaps.length * 10) * 0.5,
        }));
        break;

      case 'medium':
        // Medium profile: Balanced selection, exclude only very weak candidates
        filtered = filtered
          .filter(c => c.globalScore > 0 || c.matchPercentage > 0)
          .map(c => ({
            ...c,
            contextScore: c.globalScore,
          }));
        break;

      case 'expert':
        // Expert profile: Only top performers, high standards
        filtered = filtered
          .filter(c => c.globalScore >= 60 && c.matchPercentage >= 60)
          .map(c => ({
            ...c,
            contextScore: c.globalScore * 0.6 + c.matchPercentage * 0.4,
          }));
        break;
    }

    return filtered;
  }

  /**
   * Get activity importance recommendation based on required skills
   * Helps determine the overall complexity and stakes of the activity
   */
  async suggestActivityImportance(activityId: string): Promise<any> {
    const activity = await this.activityModel.findById(activityId).populate('requiredSkills.skillId');
    if (!activity) throw new NotFoundException('Activity not found');

    const requiredSkills = activity.requiredSkills || [];
    
    // Importance factors
    let importanceScore = 0;

    // Factor 1: Number of required skills
    if (requiredSkills.length >= 5) importanceScore += 3;
    else if (requiredSkills.length >= 3) importanceScore += 2;
    else if (requiredSkills.length >= 1) importanceScore += 1;

    // Factor 2: Average skill weight
    const avgWeight = requiredSkills.reduce((sum, req) => sum + (req.weight || 0.5), 0) / Math.max(requiredSkills.length, 1);
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
      reasoning: this.getImportanceReasoning(importanceScore, requiredSkills.length, avgWeight, activity.level),
    };
  }

  /**
   * Generate human-readable reasoning for importance suggestion
   */
  private getImportanceReasoning(score: number, skillCount: number, avgWeight: number, level: string): string {
    const factors = [];
    
    if (skillCount >= 5) factors.push(`requires ${skillCount} skills`);
    if (avgWeight >= 1.5) factors.push('high average skill weight');
    if (level === 'advanced') factors.push('advanced difficulty level');

    if (factors.length === 0) factors.push('relatively simple activity');

    return `Suggested importance ${score}/10: ${factors.join(', ')}`;
  }
}
