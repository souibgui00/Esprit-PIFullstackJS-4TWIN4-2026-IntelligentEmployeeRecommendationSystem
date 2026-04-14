import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from './schema/activity.schema';
import { CreateActivityDto, UpdateActivityDto } from './dto/activity.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { RecommendationModelService } from '../scoring/recommendation-model.service';
import { PrioritizationService } from '../prioritization/prioritization.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name)
    private activityModel: Model<Activity>,
    @InjectModel('Participation')
    private participationModel: Model<any>,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
    private recommendationModelService: RecommendationModelService,
    private prioritizationService: PrioritizationService,
    private httpService: HttpService,
  ) {}

  async create(
    createActivityDto: CreateActivityDto,
    userId: string,
  ): Promise<Activity> {
    const createdActivity = new this.activityModel({
      ...createActivityDto,
      createdBy: userId,
      workflowStatus: 'pending_approval',
    });
    const activity = await createdActivity.save();

    // Notify manager
    try {
      const creator = await this.usersService.findOne(userId);

      if (creator) {
        let managerId = creator.manager_id?.toString();
        console.log(`[ActivitiesService] Creating activity. Creator: ${creator.name}, Assigned ManagerID: ${managerId || 'None'}`);

        if (!managerId) {
          // If creator has no assigned manager, notify all managers
          const managers = await this.usersService.findManagers();
          
          console.log(`[ActivitiesService] Creator has no manager. Found ${managers.length} managers to notify.`);
          
          for (const manager of managers) {
            console.log(`[ActivitiesService] Notifying manager: ${manager.name} (${manager._id})`);
            await this.notificationsService.create({
              recipientId: manager._id.toString(),
              title: 'New Activity Suggestion',
              message: `${creator.name || 'Admin'} has suggested a new activity: ${activity.title}`,
              type: 'activity_created',
              metadata: { activityId: activity._id.toString() },
            });
          }
        } else {
          console.log(`[ActivitiesService] Notifying assigned manager ID: ${managerId}`);
          await this.notificationsService.create({
            recipientId: managerId,
            title: 'New Activity Suggestion',
            message: `${creator.name || 'Admin'} has suggested a new activity: ${activity.title}`,
            type: 'activity_created',
            metadata: { activityId: activity._id.toString() },
          });
        }
      } else {
        console.warn(`[ActivitiesService] No creator found for ID: ${userId}`);
      }
    } catch (err) {
      console.error('Failed to send notification for activity creation:', err);
    }

    return activity;
  }

  async findAll(): Promise<Activity[]> {
    return this.activityModel.find().exec();
  }

  async findOne(id: string): Promise<Activity | null> {
    return this.activityModel.findById(id).exec();
  }

  async update(
    id: string,
    updateActivityDto: UpdateActivityDto,
  ): Promise<Activity | null> {
    const activity = await this.activityModel.findById(id);
    if (activity && activity.workflowStatus === 'rejected') {
      return this.activityModel
        .findByIdAndUpdate(
          id,
          { ...updateActivityDto, workflowStatus: 'pending_approval' },
          { new: true },
        )
        .exec();
    }
    return this.activityModel
      .findByIdAndUpdate(id, updateActivityDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<any> {
    return this.activityModel.findByIdAndDelete(id).exec();
  }

  async enroll(id: string): Promise<Activity | null> {
    const activity = await this.activityModel.findById(id);
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    if (activity.workflowStatus !== 'approved') {
      throw new BadRequestException('Cannot enroll in a non-approved activity');
    }

    if (activity.capacity !== undefined && activity.capacity > 0) {
      if (activity.enrolledCount >= activity.capacity) {
        throw new BadRequestException('Activity is at full capacity');
      }
    }

    return this.activityModel
      .findByIdAndUpdate(
        id, 
        { $inc: { enrolledCount: 1 } }, 
        { new: true }
      )
      .exec();
  }

  async unenroll(id: string): Promise<Activity | null> {
    const activity = await this.activityModel.findById(id);
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    // Safety: don't go below 0
    const decrement = activity.enrolledCount > 0 ? -1 : 0;

    return this.activityModel
      .findByIdAndUpdate(
        id, 
        { $inc: { enrolledCount: decrement } }, 
        { new: true }
      )
      .exec();
  }

  async approve(id: string, userId: string): Promise<Activity | null> {
    const activity = await this.activityModel
      .findByIdAndUpdate(
        id,
        {
          workflowStatus: 'approved',
          approvedBy: userId,
          approvedAt: new Date(),
        },
        { new: true },
      )
      .exec();

    if (activity) {
      // Notify the creator (HR)
      try {
        await this.notificationsService.create({
          recipientId: activity.createdBy.toString(),
          title: 'Activity Approved',
          message: `Your activity "${activity.title}" has been approved.`,
          type: 'activity_approved',
          metadata: { activityId: activity._id.toString() },
        });
      } catch (err) {
        console.error(
          'Failed to send notification for activity approval:',
          err,
        );
      }
    }

    return activity;
  }

  async reject(
    id: string,
    userId: string,
    reason: string,
  ): Promise<Activity | null> {
    const activity = await this.activityModel
      .findByIdAndUpdate(
        id,
        {
          workflowStatus: 'rejected',
          rejectedBy: userId,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
        { new: true },
      )
      .exec();

    if (activity) {
      // Notify the creator (HR)
      try {
        await this.notificationsService.create({
          recipientId: activity.createdBy.toString(),
          title: 'Activity Rejected',
          message: `Your activity "${activity.title}" has been rejected. Reason: ${reason}`,
          type: 'activity_rejected',
          metadata: { activityId: activity._id.toString(), reason },
        });
      } catch (err) {
        console.error(
          'Failed to send notification for activity rejection:',
          err,
        );
      }
    }

    return activity;
  }

  async findPending(): Promise<Activity[]> {
    return this.activityModel
      .find({ workflowStatus: 'pending_approval' })
      .exec();
  }

  /**
   * Get activity recommendations for a user
   * Calculates compatibility score for all approved activities
   * 
   * @param userId - The user ID to generate recommendations for
   * @returns Array of recommendations sorted by score (descending)
   */
  async getRecommendations(userId: string): Promise<any[]> {
    const user = await this.usersService.findOne(userId);

    // Get all approved activities
    const approvedActivities = await this.activityModel
      .find({ workflowStatus: 'approved' })
      .populate('requiredSkills.skillId')
      .exec();

    if (approvedActivities.length === 0) return [];

    // ── Exclude activities the user already participated in ──────────────────
    const existingParticipations = await this.participationModel
      .find({ userId, status: { $in: ['started', 'completed'] } })
      .select('activityId')
      .lean();

    const excludedIds = new Set(
      existingParticipations.map((p: any) => p.activityId.toString()),
    );

    const candidateActivities = approvedActivities.filter(
      (a) => !excludedIds.has(a._id.toString()),
    );

    if (candidateActivities.length === 0) return [];
    // ────────────────────────────────────────────────────────────────────────

    const results = await Promise.all(
      candidateActivities.map(async (activity) => {
        try {
          const nlpMap = await this.getNlpScores(activity, [user]);
          const nlpData = nlpMap.get(userId);

          let score = 0;
          let nlpScore = 0;
          let rfScore = 0;

          if (nlpData && typeof nlpData === 'object') {
             score = (nlpData as any).finalScore || 0;
             nlpScore = (nlpData as any).nlpScore || 0;
             rfScore = (nlpData as any).rfScore || 0;
          } else {
             score = await this.recommendationModelService.predictScore(
               userId,
               activity._id.toString(),
             );
          }

          // Filter out activities that are completely irrelevant
          if (score < 0.05) return null;

          const gaps = await this.prioritizationService.identifySkillGaps(
            userId,
            activity._id.toString(),
          );

          // Human-readable recommendation label
          const label =
            score >= 0.85 ? 'Top Pick'
            : score >= 0.70 ? 'Highly Recommended'
            : score >= 0.50 ? 'Recommended'
            : 'Consider';

          return {
            activityId:   activity._id,
            activityName: activity.title,
            activityType: activity.type,
            level:        activity.level,
            date:         activity.date,
            duration:     activity.duration,
            score,
            nlpScore,
            rfScore,
            scorePercent: Math.round(score * 100),
            label,
            gap: gaps,
          };
        } catch (error) {
          console.error(
            `[ActivitiesService] Recommendation error for activity ${activity._id}:`,
            error,
          );
          return null;
        }
      }),
    );

    return results
      .filter(Boolean)                      // remove nulls (errors + <5% scores)
      .sort((a: any, b: any) => b.score - a.score); // highest score first
  }

  private async getNlpScores(
    activity: any,
    employees: any[],
  ): Promise<Map<string, any>> {
    try {
      const payload = {
        activity: {
          activityId: activity._id.toString(),
          title: activity.title,
          description: activity.description || '',
          requiredSkills: (activity.requiredSkills || []).map((r: any) => {
            const skill = r.skillId;
            return skill?.name || skill?.toString() || '';
          }),
        },
        employees: employees.map((u: any) => {
          let perfRating = 3;
          if (u.rankScore >= 90) perfRating = 4;
          else if (u.rankScore >= 60) perfRating = 3;
          else if (u.rankScore >= 30) perfRating = 2;
          else perfRating = 1;

          return {
            userId: u._id.toString(),
            name: u.name,
            position: u.position || '',
            jobDescription: u.jobDescription || '',
            skills: (u.skills || []).map((s: any) => s.skillId?.name || s.skillId?.toString() || '').filter(Boolean),
            age: 30,
            department: u.department_id?.name || 'General',
            jobRole: u.role || 'Employee',
            yearsAtCompany: u.yearsOfExperience || 2,
            performanceRating: perfRating,
            monthlyIncome: 64000,
            jobSatisfaction: 3,
            jobInvolvement: 3,
            education: 3,
            score: u.rankScore || 50.0
          };
        }),
      };

      const response = await firstValueFrom(
        this.httpService.post<any>('http://localhost:8000/recommend', payload),
      );

      const nlpMap = new Map<string, any>();
      for (const item of response.data.scores || []) {
        nlpMap.set(item.userId, {
          nlpScore: item.nlpScore,
          rfScore: item.rfScore,
          finalScore: item.finalScore,
        });
      }
      return nlpMap;
    } catch (error: any) {
      console.warn('[ActivitiesService] NLP service unavailable, skipping NLP scores:', error.message);
      return new Map();
    }
  }

  async getRecommendationsForActivity(activityId: string): Promise<any> {
    const activity = await this.activityModel.findById(activityId).populate('requiredSkills.skillId').exec();
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${activityId} not found`);
    }

    const users = await this.usersService.findAll();
    const employees = (users || []).filter(
      (user: any) => String(user.role || '').toUpperCase() === Role.EMPLOYEE,
    );

    const nlpScores = await this.getNlpScores(activity, employees);

    const rankedCandidates = await Promise.all(
      employees.map(async (user: any) => {
        try {
          const userId = user._id?.toString();

          const gap = await this.prioritizationService.identifySkillGaps(
            userId,
            activityId,
          );

          // Get NLP + RF score from Python service
          const nlpData = nlpScores.get(userId);
          
          if (nlpData && typeof nlpData === 'object') {
            // Python service returned full score object
            return {
              userId,
              name: user.name,
              role: user.role,
              score: (nlpData as any).finalScore || 0,
              nlpScore: (nlpData as any).nlpScore || 0,
              rfScore: (nlpData as any).rfScore || 0,
              gap,
            };
          }

          // Fallback to hybrid model if Python service unavailable
          const score = await this.recommendationModelService.predictScore(
            userId,
            activityId,
          );
          return {
            userId,
            name: user.name,
            role: user.role,
            score,
            gap,
          };
        } catch (error) {
          console.error(
            `[ActivitiesService] Failed to score user ${user._id} for activity ${activityId}:`,
            error,
          );
          return {
            userId: user._id?.toString(),
            name: user.name,
            role: user.role,
            score: 0,
            gap: [],
          };
        }
      }),
    );

    const candidates = rankedCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      activity: {
        activityId: activity._id,
        title: activity.title,
        type: activity.type,
        level: activity.level,
        date: activity.date,
        duration: activity.duration,
      },
      candidates,
    };
  }

  async extractSkillsFromDescription(description: string, title: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<any>('http://localhost:8000/extract-skills', {
          description,
          title,
        }),
      );
      return response.data;
    } catch (error: any) {
      console.warn('[ActivitiesService] NLP skill extraction unavailable:', error.message);
      return { extractedSkills: [], confidence: 0 };
    }
  }
}
