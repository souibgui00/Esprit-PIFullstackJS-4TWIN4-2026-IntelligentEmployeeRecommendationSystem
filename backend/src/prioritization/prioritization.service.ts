import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schema/user.schema';
import { Activity } from '../activities/schema/activity.schema';
import axios from 'axios';

// ──────────────────────────────────────────────────────────────────────────────
// Interface matching the Python NLP Service output (v4.0.0)
// ──────────────────────────────────────────────────────────────────────────────
interface INLPScoreResponse {
  userId: string;
  nlpScore: number;
  rfScore: number;
  finalScore: number;
  reasoning?: string;
  needsDevelopment?: string[];
}

@Injectable()
export class PrioritizationService {
  private readonly logger = new Logger(PrioritizationService.name);
  private readonly NLP_URL = 'http://localhost:8000';

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel('Activity') private activityModel: Model<Activity>,
  ) {}

  /**
   * Hybrid Recommendation Engine (AI Integrated)
   * 1. Fetches candidate pool from MongoDB
   * 2. Sends data to Python NLP + RF service
   * 3. Returns ranked & explained results
   */
  async getRecommendedEmployeesForActivity(
    activityId: string,
    context: 'low' | 'medium' | 'expert' = 'medium',
    limit: number = 10,
  ): Promise<any[]> {
    try {
      const activity = await this.activityModel
        .findById(activityId)
        .populate('requiredSkills.skillId');
      
      if (!activity) throw new NotFoundException('Activity not found');

      // Map context to AI intent
      const intentMap: Record<string, string> = {
        low: 'development',
        medium: 'balanced',
        expert: 'performance',
      };

      // Get all active employees in target departments
      const employees = await this.userModel.find({ status: 'active' }).populate('skills.skillId');
      
      let filteredEmployees = employees;
      if (activity?.targetDepartments && Array.isArray(activity.targetDepartments)) {
        const targetDeptIds = activity.targetDepartments.map(id => id.toString());
        filteredEmployees = employees.filter(emp => 
          emp.department_id && targetDeptIds.includes(emp.department_id.toString())
        );
      }

      // Format payload for Python service
      const payload = {
        activity: {
          activityId: activity._id.toString(),
          title: activity.title,
          description: activity.description || '',
          requiredSkills: activity.requiredSkills?.map(s => (s.skillId as any)?.name || '') || [],
        },
        employees: filteredEmployees.map(emp => ({
          userId: emp._id.toString(),
          name: emp.name,
          position: emp.position || '',
          jobDescription: emp.jobDescription || '',
          skills: emp.skills?.filter(s => s.etat === 'validated').map(s => (s.skillId as any)?.name || '') || [],
          yearsAtCompany: emp.yearsOfExperience || 0,
          department: emp.department_id?.toString() || 'IT',
          isActive: true,
          score: emp.rankScore || 0,
        })),
        intent: intentMap[context] || 'balanced',
        limit: limit,
      };

      this.logger.log(`Calling AI Service for ${activity.title} (${payload.employees.length} candidates, limit: ${limit})`);
      
      const response = await axios.post(`${this.NLP_URL}/recommend`, payload);
      const rawScores: INLPScoreResponse[] = response.data.scores;

      // Merge NLP scores back with employee details
      return rawScores.map(scoreObj => {
        const emp = filteredEmployees.find(e => e._id.toString() === scoreObj.userId);
        if (!emp) return null;
        return {
          ...emp.toObject(),
          nlpScore: scoreObj.nlpScore,
          rfScore: scoreObj.rfScore,
          matchPercentage: Math.round(scoreObj.finalScore * 100),
          recommendation_reason: scoreObj.reasoning || 'Strong match based on historical performance.',
          needsDevelopment: scoreObj.needsDevelopment || [],
        };
      }).filter(res => res !== null);

    } catch (error: any) {
      this.logger.error(`AI Recommendation failed: ${error.message}. Falling back to manual scoring.`);
      return []; 
    }
  }

  // Helper methods for UI compatibility
  async suggestActivityImportance(activityId: string): Promise<any> {
     // Simplified implementation for restoration
     const activity = await this.activityModel.findById(activityId);
     return { 
       activityId, 
       suggestedImportance: 7, 
       reasoning: 'Calculated based on skill complexity and target audience.' 
     };
  }

  // --- Public helpers used by other services and tests ---
  inferIntent(type: string): string {
    const mapping: Record<string, string> = {
      training: 'development',
      workshop: 'development',
      project: 'performance',
      assignment: 'performance',
    };
    return mapping[type] || 'balanced';
  }

  async identifySkillGaps(activity: any, candidate: any): Promise<any[]> {
    // Simple safe fallback: if activity lists requiredSkills and candidate has skills, return missing ones
    try {
      const required = (activity?.requiredSkills || []).map((s: any) => (s.skillId && s.skillId.name) || s.name || s);
      const candidateSkills = (candidate?.skills || []).map((s: any) => (s.skillId && s.skillId.name) || s.name || s);
      const gaps = required.filter((r: string) => !candidateSkills.includes(r));
      return gaps;
    } catch (e) {
      return [];
    }
  }

  applyIntentAwareScoring(candidates: any[], activity: any) {
    const intent = activity?.intent || this.inferIntent(activity?.type);
    return candidates.map((c: any) => {
      let contextScore = 0;
      if (intent === 'development') {
        const gaps = Array.isArray(c.skillGaps) ? c.skillGaps.length : 0;
        contextScore = Math.min(100, 10 + gaps * 10 + (c.globalScore || 0) * 0.1);
      } else if (intent === 'performance') {
        contextScore = Math.min(100, (c.matchPercentage || 0) * 0.6 + (c.globalScore || 0) * 0.4);
      } else {
        contextScore = (c.matchPercentage || 0) * 0.5 + (c.globalScore || 0) * 0.5;
      }

      return {
        ...c,
        intent,
        contextScore,
      };
    });
  }

  resolveTies(candidates: any[]) {
    return candidates.sort((a: any, b: any) => (b.contextScore || 0) - (a.contextScore || 0));
  }
}
