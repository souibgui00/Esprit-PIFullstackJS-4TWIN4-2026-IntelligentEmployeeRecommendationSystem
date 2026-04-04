import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../users/schema/user.schema';
import { Activity } from '../activities/schema/activity.schema';

/**
 * Dynamic Scoring Module
 * Calculates numeric scores for each employee's skills and activities
 * Provides global activity scoring and automatic updates after participation
 */
@Injectable()
export class ScoringService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel('Activity')
    private activityModel: Model<Activity>,
    @InjectModel('Participation')
    private participationModel: Model<any>,
  ) {}

  /**
   * Calculate individual skill score for an employee
   * Score range: 0-120 (exceeds 100 to allow for bonus growth)
    *
   * Formula:
    * Final Score = Base Score + Experience Bonus + Progression Bonus + Feedback Bonus
   * - Base Score: Based on proficiency level (25/50/75/100)
   * - Experience Bonus: Years of experience * 2 (capped at 20)
   * - Progression Bonus: 5 points if skill updated within last 6 months
    * - Feedback Bonus: manager rating (1..5) * 2
   */
  async calculateSkillScore(userId: string, skillId: string): Promise<number> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const skillIndex = user.skills?.findIndex((s: any) => s.skillId?.toString() === skillId);
    if (skillIndex === -1 || skillIndex === undefined) {
      throw new NotFoundException('Skill not found for this user');
    }

    const skill = user.skills[skillIndex];
    
    // Base score based on level
    const baseScore = this.getLevelBaseScore(skill.level);
    
    // Experience bonus
    const experienceBonus = this.calculateExperienceBonus(user.yearsOfExperience || 0);
    
    // Progression bonus (recent updates within 6 months)
    const progressionBonus = this.getProgressionBonus(skill.lastUpdated);
    
    // Feedback bonus from manager rating
    const feedbackBonus = this.calculateWeightedFeedback(skill.auto_eval, skill.hierarchie_eval);
    
    const skillScore =
      baseScore + experienceBonus + progressionBonus + feedbackBonus;
    const finalScore = Math.min(skillScore, 120);

    return Math.round(finalScore * 10) / 10;
  }

  /**
   * Get all skill scores for an employee
   * Returns array of skill scores with metadata
   */
  async getEmployeeSkillScores(userId: string): Promise<any[]> {
    const user = await this.userModel.findById(userId).populate('skills.skillId');
    if (!user) throw new NotFoundException('User not found');

    const skillScores = [];
    
    if (user.skills && user.skills.length > 0) {
      for (const skill of user.skills) {
        const score = await this.calculateSkillScore(userId, skill.skillId?.toString());
        skillScores.push({
          skillId: skill.skillId?._id || skill.skillId,
          skillName: skill.skillId?.name || 'Unknown',
          skillType: skill.skillId?.type || 'knowledge',
          level: skill.level,
          score: score,
          auto_eval: skill.auto_eval || 0,
          hierarchie_eval: skill.hierarchie_eval || 0,
          lastUpdated: skill.lastUpdated,
        });
      }
    }

    return skillScores;
  }

  /**
   * Calculate global activity score for an employee
   * Combines all required skills with their weights
   * 
   * Formula:
   * Global Activity Score = Σ (Skill Score × Skill Weight)
   */
  async calculateGlobalActivityScore(userId: string, activityId: string): Promise<number> {
    const user = await this.userModel.findById(userId);
    const activity = await this.activityModel.findById(activityId);

    if (!user) throw new NotFoundException('User not found');
    if (!activity) throw new NotFoundException('Activity not found');

    let totalScore = 0;
    const requiredSkills = activity.requiredSkills || [];

    for (const req of requiredSkills) {
      const reqSkillId = req.skillId?.toString().replace(/^ObjectId\(['"]?|['"]?\)$/g, '');
      const userSkill = user.skills?.find(s => {
        const sId = s.skillId?.toString().replace(/^ObjectId\(['"]?|['"]?\)$/g, '');
        return sId === reqSkillId;
      });
      const skillScore = userSkill ? await this.calculateSkillScore(userId, userSkill.skillId?.toString()) : 0;
      const weight = req.weight || 0.5;
      
      totalScore += skillScore * weight;
    }

    // Normalize by total weights
    const totalWeight = requiredSkills.reduce((sum, req) => sum + (req.weight || 0.5), 0);
    const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return Math.round(normalizedScore * 10) / 10;
  }

  /**
   * Get activity match percentage for an employee
   * Indicates how well the employee's skills match the activity requirements
   */
  async getActivityMatchPercentage(userId: string, activityId: string): Promise<number> {
    const user = await this.userModel.findById(userId);
    const activity = await this.activityModel.findById(activityId);

    if (!user) throw new NotFoundException('User not found');
    if (!activity) throw new NotFoundException('Activity not found');

    const requiredSkills = activity.requiredSkills || [];
    if (requiredSkills.length === 0) return 100;

    const levelOrder: Record<string, number> = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4,
    };

    let matchedCount = 0;

    for (const req of requiredSkills) {
      const reqSkillId = req.skillId?.toString().replace(/^ObjectId\(['"]?|['"]?\)$/g, '');
      const userSkill = user.skills?.find(s => {
        const sId = s.skillId?.toString().replace(/^ObjectId\(['"]?|['"]?\)$/g, '');
        return sId === reqSkillId;
      });
      if (!userSkill) continue;

      const userLevel = levelOrder[userSkill.level] || 1;
      const requiredLevel = levelOrder[req.requiredLevel] || 1;

      if (userLevel >= requiredLevel) {
        matchedCount++;
      }
    }

    return Math.round((matchedCount / requiredSkills.length) * 100);
  }

  /**
   * Automatically update skill scores after activity participation
   * Called when a user completes an activity with feedback
   */
  async updateSkoresAfterParticipation(
    userId: string,
    activityId: string,
    feedbackRating: number,
  ): Promise<any> {
    const user = await this.userModel.findById(userId);
    const activity = await this.activityModel.findById(activityId);

    if (!user) throw new NotFoundException('User not found');
    if (!activity) throw new NotFoundException('Activity not found');

    if (feedbackRating < 0 || feedbackRating > 100) {
      throw new BadRequestException('Feedback rating must be between 0 and 100');
    }
    const normalizedFeedback = this.normalizeManagerRating(feedbackRating);

    const learningRate = 0.1; // 10% learning rate per feedback unit
    const requiredSkills = activity.requiredSkills || [];

    // Update each required skill based on feedback and weight
    for (const req of requiredSkills) {
      const weight = req.weight || 0.5;
      const reqSkillId = req.skillId?.toString().replace(/^ObjectId\(['"]?|['"]?\)$/g, '');
      const skillIndex = user.skills?.findIndex(s => {
        const sId = s.skillId?.toString().replace(/^ObjectId\(['"]?|['"]?\)$/g, '');
        return sId === reqSkillId;
      });
      
      if (skillIndex !== -1 && skillIndex !== undefined) {
        const skill = user.skills[skillIndex];

        // Get the live computed score instead of the stale stored value
        const currentLiveScore = await this.calculateSkillScore(userId, skill.skillId?.toString());

        // Dynamic Update: New Score = Live Score + (Feedback × Weight × Learning Rate)
        const increment = normalizedFeedback * weight * learningRate;
        const newScore = Math.min(currentLiveScore + increment, 120);

        user.skills[skillIndex] = {
          ...skill,
          score: Math.round(newScore * 10) / 10,
          lastUpdated: new Date(),
        };
      } else {
        // Add skill if not already present (for skills not yet in user's profile)
        const increment = normalizedFeedback * weight * learningRate;
        const newScore = Math.min(25 + increment, 120); // Start from beginner level
        
        const newSkill = {
          skillId: new Types.ObjectId(req.skillId),
          level: 'beginner',
          score: Math.round(newScore * 10) / 10,
          auto_eval: 0,
          hierarchie_eval: 0,
          lastUpdated: new Date(),
        };
        
        user.skills = [...(user.skills || []), newSkill];
      }
    }

    user.markModified('skills');
    await user.save();

    return {
      userId,
      activityId,
      feedbackRating: normalizedFeedback,
      updatedSkills: requiredSkills.length,
      timestamp: new Date(),
    };
  }

  /**
   * Get score analytics for an employee
   * Includes min, max, average, and category breakdown
   */
  async getScoreAnalytics(userId: string): Promise<any> {
    const skillScores = await this.getEmployeeSkillScores(userId);
    
    if (skillScores.length === 0) {
      return {
        userId,
        totalSkills: 0,
        averageScore: 0,
        minScore: 0,
        maxScore: 0,
        categoryBreakdown: {},
      };
    }

    const scores = skillScores.map(s => s.score);
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // Category breakdown
    const categoryBreakdown: Record<string, any> = {};
    
    skillScores.forEach(skill => {
      const type = skill.skillType || 'knowledge';
      if (!categoryBreakdown[type]) {
        categoryBreakdown[type] = {
          count: 0,
          totalScore: 0,
          averageScore: 0,
        };
      }
      categoryBreakdown[type].count++;
      categoryBreakdown[type].totalScore += skill.score;
    });

    // Calculate averages per category
    Object.keys(categoryBreakdown).forEach(cat => {
      categoryBreakdown[cat].averageScore = 
        Math.round((categoryBreakdown[cat].totalScore / categoryBreakdown[cat].count) * 10) / 10;
    });

    return {
      userId,
      totalSkills: skillScores.length,
      averageScore: Math.round(averageScore * 10) / 10,
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores),
      categoryBreakdown,
      skillDetails: skillScores,
    };
  }

  /**
   * Compare skill scores of multiple employees
   * Useful for team analysis and recommendations
   */
  async compareEmployeeScores(userIds: string[]): Promise<any[]> {
    const comparisons = [];

    for (const userId of userIds) {
      const analytics = await this.getScoreAnalytics(userId);
      const user = await this.userModel.findById(userId).select('name email matricule rank rankScore');
      
      comparisons.push({
        ...user?.toObject(),
        scoreAnalytics: analytics,
      });
    }

    return comparisons;
  }

  // ─── Helper Methods ──────────────────────────────────────────────────────────

  private getLevelBaseScore(level: string | number): number {
    const normalized = String(level).toLowerCase();
    const semanticLevelMap: Record<string, number> = {
      low: 1,
      beginner: 1,
      medium: 2,
      intermediate: 2,
      high: 3,
      advanced: 3,
      expert: 4,
    };

    const parsedNumeric = Number(level);
    const numericLevel = Number.isFinite(parsedNumeric)
      ? parsedNumeric
      : semanticLevelMap[normalized] || 1;

    const clampedLevel = Math.max(1, Math.min(4, Math.round(numericLevel)));
    return clampedLevel * 25;
  }

  private getProgressionBonus(lastUpdated: Date | null): number {
    if (!lastUpdated) return 0;
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    return lastUpdated > sixMonthsAgo ? 5 : 0;
  }

  private calculateExperienceBonus(years: number): number {
    const safeYears = Math.max(0, Number(years) || 0);
    return Math.min(safeYears * 2, 20);
  }

  private normalizeManagerRating(value: number): number {
    const raw = Number(value);

    // Invalid or missing value — return 0 (no feedback)
    if (!Number.isFinite(raw) || raw < 0) return 0;

    // Schema stores evaluations on 0–100 scale
    // Normalize to 1–5: divide by 20, clamp between 1 and 5
    // Special case: 0 means no evaluation submitted yet, return 0
    if (raw === 0) return 0;
    return Math.max(1, Math.min(5, raw / 20));
  }

  private calculateWeightedFeedback(auto: number, manager: number): number {
    const normalizedAuto = this.normalizeManagerRating(auto);
    const normalizedManager = this.normalizeManagerRating(manager);
    return ((0.4 * normalizedAuto) + (0.6 * normalizedManager)) * 2;
  }
}
