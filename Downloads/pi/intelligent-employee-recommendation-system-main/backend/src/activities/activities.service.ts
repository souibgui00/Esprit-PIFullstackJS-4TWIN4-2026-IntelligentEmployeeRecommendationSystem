import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
    @InjectModel('Assignment')
    private assignmentModel: Model<any>,
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
        const managerId = creator.manager_id?.toString();
        console.log(
          `[ActivitiesService] Creating activity. Creator: ${creator.name}, Assigned ManagerID: ${managerId || 'None'}`,
        );

        if (!managerId) {
          console.log(
            `[ActivitiesService] Creator has no manager. Skipping automatic manager notification (frontend will handle targeted department notifications if applicable).`,
          );
        } else {
          console.log(
            `[ActivitiesService] Notifying assigned manager ID: ${managerId}`,
          );
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

  async findAll(userRole?: string, userId?: string): Promise<Activity[]> {
    if (userRole === Role.EMPLOYEE && userId) {
      // Find all activities where the user has an assignment OR a participation
      const [assignments, participations] = await Promise.all([
        this.assignmentModel
          .find({ userId: new Types.ObjectId(userId) })
          .exec(),
        this.participationModel
          .find({ userId: new Types.ObjectId(userId) })
          .exec(),
      ]);

      const allowedActivityIds = new Set([
        ...assignments.map((a) => a.activityId.toString()),
        ...participations.map((p) => p.activityId.toString()),
      ]);

      return this.activityModel
        .find({
          _id: {
            $in: Array.from(allowedActivityIds).map(
              (id) => new Types.ObjectId(id),
            ),
          },
        })
        .exec();
    }

    // Default: Admin/HR/Manager see everything
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
    if (!activity) return null;

    const isResubmission = activity.workflowStatus === 'rejected';

    const updatedActivity = await this.activityModel
      .findByIdAndUpdate(
        id,
        isResubmission
          ? { ...updateActivityDto, workflowStatus: 'pending_approval' }
          : updateActivityDto,
        { new: true },
      )
      .exec();

    if (isResubmission && updatedActivity) {
      // Notify target managers about the resubmission
      try {
        const targetDeptIds =
          (updateActivityDto as any).targetDepartments ||
          activity.targetDepartments ||
          [];
        const managerIdsToNotify = new Set<string>();

        // Always notify the person who rejected it
        if (activity.rejectedBy) {
          managerIdsToNotify.add(activity.rejectedBy.toString());
        }

        // Also notify managers of targeted departments
        if (targetDeptIds.length > 0) {
          const allUsers = await this.usersService.findAll();
          const targetManagers = allUsers.filter((u) => {
            if (u.role?.toLowerCase() !== 'manager') return false;
            const userDeptId = u.department_id?.toString();
            return targetDeptIds.some(
              (dId: any) => dId.toString() === userDeptId,
            );
          });

          for (const manager of targetManagers) {
            managerIdsToNotify.add(manager._id.toString());
          }
        }

        for (const managerId of Array.from(managerIdsToNotify)) {
          await this.notificationsService.create({
            recipientId: managerId,
            title: '🔄 Activity Revised & Resubmitted',
            message: `HR has updated "${updatedActivity.title}" based on previous feedback. Please review and approve.`,
            type: 'activity_created',
            metadata: { activityId: updatedActivity._id.toString() },
          });
        }
      } catch (err) {
        console.error('Failed to send resubmission notifications:', err);
      }
    }

    return updatedActivity;
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
      .findByIdAndUpdate(id, { $inc: { enrolledCount: 1 } }, { new: true })
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
        { new: true },
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
          title: 'Strategic Activity Approved',
          message: `Success: The development program "${activity.title}" has been authorized for deployment.`,
          type: 'activity_approved',
          metadata: {
            activityId: activity._id.toString(),
            status: 'approved',
          },
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
          title: 'Activity Revision Required',
          message: `The program "${activity.title}" requires modifications. Feedback: ${reason}`,
          type: 'activity_rejected',
          metadata: {
            activityId: activity._id.toString(),
            reason,
            status: 'rejected',
          },
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

  async findRecommendationEligible(
    includeCompleted = false,
  ): Promise<Activity[]> {
    const query: any = { workflowStatus: 'approved' };
    if (!includeCompleted) {
      query.status = { $ne: 'completed' };
    }

    return this.activityModel
      .find(query)
      .sort({ date: 1, createdAt: -1 })
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
    const datasetMap = await this.fetchDatasetProfileMap();
    const enrichedUser = this.mergeDatasetProfile(user, datasetMap);

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
          const intent =
            activity.intent ||
            this.prioritizationService.inferIntent(activity.type);
          const nlpMap = await this.getNlpScores(
            activity,
            [enrichedUser],
            intent,
          );
          const nlpData = nlpMap.get(userId);

          let score = 0;
          let nlpScore = 0;
          let rfScore = 0;

          if (nlpData && typeof nlpData === 'object') {
            score = nlpData.finalScore || 0;
            nlpScore = nlpData.nlpScore || 0;
            rfScore = nlpData.rfScore || 0;
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
            score >= 0.85
              ? 'Top Pick'
              : score >= 0.7
                ? 'Highly Recommended'
                : score >= 0.5
                  ? 'Recommended'
                  : 'Consider';

          return {
            activityId: activity._id,
            activityName: activity.title,
            activityType: activity.type,
            level: activity.level,
            date: activity.date,
            duration: activity.duration,
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
      .filter(Boolean) // remove nulls (errors + <5% scores)
      .sort((a: any, b: any) => b.score - a.score); // highest score first
  }

  private async getNlpScores(
    activity: any,
    employees: any[],
    intent: string,
    customDescription: string = '',
  ): Promise<Map<string, any>> {
    try {
      const payload = {
        activity: {
          activityId: activity._id.toString(),
          title: activity.title,
          description: (
            (activity.description || '') +
            ' ' +
            customDescription
          ).trim(),
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

          const datasetScore =
            u.avgScore ?? u.avgFicheEtat ?? u.rankScore ?? u.score ?? 50.0;
          const datasetValidationRate = u.validationRate ?? null;
          const datasetCompetences = u.nbCompetences ?? null;
          const datasetDate = u.dateEmbauche ?? null;
          const yearsAtCompany =
            u.yearsOfExperience ??
            u.yearsAtCompany ??
            (datasetDate
              ? Math.max(
                  0,
                  Math.floor(
                    (Date.now() - new Date(datasetDate).getTime()) /
                      (365.25 * 24 * 60 * 60 * 1000),
                  ),
                )
              : 2);

          return {
            userId: u._id.toString(),
            name: u.name,
            position: u.position || '',
            jobDescription: u.jobDescription || '',
            skills: (u.skills || [])
              .map((s: any) => s.skillId?.name || s.skillId?.toString() || '')
              .filter(Boolean),
            age: 30,
            department: u.department_id?.name || u.departmentCode || 'General',
            jobRole:
              u.jobRole ||
              u.position ||
              u.departmentCode ||
              u.role ||
              'Employee',
            yearsAtCompany,
            performanceRating: u.avgFicheEtat ?? perfRating,
            monthlyIncome: 64000,
            jobSatisfaction: 3,
            jobInvolvement: datasetValidationRate
              ? Math.max(1, Math.min(4, Math.round(datasetValidationRate * 4)))
              : 3,
            education: datasetCompetences
              ? Math.max(
                  1,
                  Math.min(5, Math.round(Number(datasetCompetences) / 2)),
                )
              : 3,
            score: datasetScore,
            matricule: u.matricule,
            statut: u.statut || u.status || 'active',
            departmentCode: u.departmentCode,
            dateEmbauche: datasetDate,
            nbSessions: u.nbSessions,
            nbCompetences: datasetCompetences,
            avgScore: u.avgScore,
            maxScore: u.maxScore,
            minScore: u.minScore,
            avgFicheEtat: u.avgFicheEtat,
            validatedCount: u.validatedCount,
            draftCount: u.draftCount,
            inProgressCount: u.inProgressCount,
            completedCount: u.completedCount,
            totalFiches: u.totalFiches,
            validationRate: datasetValidationRate,
            scoreBusiness: u.scoreBusiness,
            scoreCustomer: u.scoreCustomer,
            scoreDigital: u.scoreDigital,
            scoreHard: u.scoreHard,
            scoreInnovation: u.scoreInnovation,
            scoreManagerial: u.scoreManagerial,
            scoreSoft: u.scoreSoft,
            scoreTechnical: u.scoreTechnical,
          };
        }),
        intent, // ← passed to Python for NLP score inversion
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
      console.warn(
        '[ActivitiesService] NLP service unavailable, skipping NLP scores:',
        error.message,
      );
      return new Map();
    }
  }

  private async fetchDatasetProfileMap(): Promise<Map<string, any>> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<any>('http://localhost:8000/dataset/employees'),
      );

      const profiles = Array.isArray(response.data?.employees)
        ? response.data.employees
        : [];

      return new Map(
        profiles
          .map(
            (profile: any) =>
              [String(profile.matricule || '').toLowerCase(), profile] as const,
          )
          .filter((entry: readonly [string, any]) => !!entry[0]),
      );
    } catch (error: any) {
      console.warn(
        '[ActivitiesService] Dataset service unavailable, continuing with Mongo-only profiles:',
        error.message,
      );
      return new Map();
    }
  }

  private mergeDatasetProfile(user: any, datasetMap: Map<string, any>) {
    if (!user) return user;

    const matricule = String(user?.matricule || '').toLowerCase();
    const profile = datasetMap.get(matricule);
    if (!profile) {
      return user;
    }

    return {
      ...user,
      matricule: profile.matricule || user.matricule,
      statut: profile.statut || user.status,
      departmentCode: profile.departmentCode || user.departmentCode,
      dateEmbauche:
        profile.dateEmbauche || user.date_embauche || user.dateEmbauche,
      nbSessions: profile.nbSessions,
      nbCompetences: profile.nbCompetences,
      avgScore: profile.avgScore,
      maxScore: profile.maxScore,
      minScore: profile.minScore,
      avgFicheEtat: profile.avgFicheEtat,
      validatedCount: profile.validatedCount,
      draftCount: profile.draftCount,
      inProgressCount: profile.inProgressCount,
      completedCount: profile.completedCount,
      totalFiches: profile.totalFiches,
      validationRate: profile.validationRate,
      scoreBusiness: profile.scoreBusiness,
      scoreCustomer: profile.scoreCustomer,
      scoreDigital: profile.scoreDigital,
      scoreHard: profile.scoreHard,
      scoreInnovation: profile.scoreInnovation,
      scoreManagerial: profile.scoreManagerial,
      scoreSoft: profile.scoreSoft,
      scoreTechnical: profile.scoreTechnical,
      yearsOfExperience: profile.dateEmbauche
        ? Math.max(
            0,
            Math.floor(
              (Date.now() - new Date(profile.dateEmbauche).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000),
            ),
          )
        : user.yearsOfExperience,
      department:
        user.department_id?.name ||
        profile.departmentCode ||
        user.department ||
        'General',
      position: user.position || profile.departmentCode || user.role,
      score: profile.avgScore ?? user.rankScore ?? user.score,
      rankScore: profile.avgFicheEtat ?? user.rankScore ?? user.score,
    };
  }

<<<<<<< HEAD
  async getRecommendationsForActivity(activityId: string, optionsOrPrompt: any = {}): Promise<any> {
    const options = typeof optionsOrPrompt === 'string' ? { prompt: optionsOrPrompt } : optionsOrPrompt;
    const prompt = options.prompt;
    const activity = await this.activityModel.findById(activityId).populate('requiredSkills.skillId').exec();
=======
  async getRecommendationsForActivity(
    activityId: string,
    options: any = {},
  ): Promise<any> {
    const activity = await this.activityModel
      .findById(activityId)
      .populate('requiredSkills.skillId')
      .exec();
>>>>>>> dd895aa (reverting old work)
    if (!activity) {
      throw new NotFoundException(`Activity with ID ${activityId} not found`);
    }

    let promptText = '';
    let promptSkills: string[] = [];
    if (typeof options === 'string') {
      promptText = options.trim();
    } else if (options && typeof options === 'object' && options.prompt) {
      promptText = options.prompt.trim();
    }
    if (promptText) {
      const extracted = await this.extractSkillsFromDescription(
        promptText,
        activity.title || '',
      );
      promptSkills = Array.from(
        new Set(
          ((extracted?.extractedSkills || []) as string[])
            .map((s) => (s || '').trim())
            .filter(Boolean),
        ),
      );
    }

    // 1. Initial Filtering: Department
    const allUsers = await this.usersService.findAll();
    const datasetMap = await this.fetchDatasetProfileMap();
    const targetDeptIds = activity.targetDepartments || [];

    let eligibleEmployees = (allUsers || []).filter(
      (user: any) => String(user.role || '').toUpperCase() === Role.EMPLOYEE,
    );

    if (targetDeptIds.length > 0) {
      eligibleEmployees = eligibleEmployees.filter((user: any) => {
        const userDeptId =
          user.department_id?._id?.toString() || user.department_id?.toString();
        return targetDeptIds.includes(userDeptId);
      });
    }

    // 2. Exclusion Filtering: Already Invited or Enrolled
    const existingParticipationsList = await this.participationModel
      .find({ activityId: new Types.ObjectId(activityId) })
      .lean();
    const existingAssignmentsList = await this.assignmentModel
      .find({ activityId: new Types.ObjectId(activityId) })
      .lean();

    const excludedUserIds = new Set([
      ...existingParticipationsList.map((p: any) => p.userId.toString()),
      ...existingAssignmentsList.map((a: any) => a.userId.toString()),
    ]);

    let candidatesToScore = eligibleEmployees.filter(
      (user: any) => !excludedUserIds.has(user._id.toString()),
    );

    if (candidatesToScore.length === 0) {
      return { activity: activity, candidates: [] };
    }

    // ⚡ Performance Fix 1: Pre-filter by skill overlap BEFORE the expensive NLP call.
    // This reduces 1500 employees → ~50-300 candidates, dramatically speeding up scoring.
    const requiredSkillIds = new Set(
      (activity.requiredSkills || [])
        .map((r: any) => (r.skillId?._id ?? r.skillId)?.toString()?.trim())
        .filter(Boolean),
    );

    if (requiredSkillIds.size > 0) {
      const intent =
        activity.intent ||
        this.prioritizationService.inferIntent(activity.type);

      const filtered = candidatesToScore.filter((user: any) => {
        const userSkillIds = (user.skills || []).map((s: any) =>
          s.skillId?.toString()?.trim(),
        );
        const hasOverlap = userSkillIds.some((id: string) =>
          requiredSkillIds.has(id),
        );
        // For 'development' intent: prefer employees MISSING skills (skill gaps = good)
        // For 'performance' intent: prefer employees WHO HAVE the skills
        // For 'balanced': include all with any overlap
        if (intent === 'development') return !hasOverlap || hasOverlap; // keep all for dev
        return hasOverlap;
      });

      // Guarantee a minimum pool so we always return results
      candidatesToScore =
        filtered.length >= 30 ? filtered : candidatesToScore.slice(0, 200);
    }

    // ⚡ Hard cap at 300 to keep NLP fast regardless of pool size
    if (candidatesToScore.length > 300) {
      candidatesToScore = candidatesToScore.slice(0, 300);
    }

    // 3. Scoring — intent-aware hybrid
    const intent =
      activity.intent || this.prioritizationService.inferIntent(activity.type);
    const nlpActivity = {
      _id: activity._id,
      title: activity.title,
      description: [activity.description || '', promptText]
        .filter(Boolean)
        .join(' ')
        .trim(),
      requiredSkills: [
        ...(activity.requiredSkills || []),
        ...promptSkills.map((name: string) => ({ skillId: name })),
      ],
    };

    const enrichedCandidates = candidatesToScore.map((user: any) =>
      this.mergeDatasetProfile(user, datasetMap),
    );
    const nlpScores = await this.getNlpScores(
      nlpActivity,
      enrichedCandidates,
      intent,
    );

    const promptSkillSet = new Set(promptSkills.map((s) => s.toLowerCase()));
    const employeeSkillMap = new Map<string, Set<string>>(
      enrichedCandidates.map((u: any) => [
        u._id?.toString(),
        new Set(
          (u.skills || [])
            .map((s: any) =>
              (s.skillId?.name || s.skillId?.toString() || '').toLowerCase(),
            )
            .filter(Boolean),
        ),
      ]),
    );

    // Build gap + context scores for all candidates first
    const candidatesMeta = await Promise.all(
      enrichedCandidates.map(async (user: any) => {
        const userId = user._id?.toString();
        const gap = await this.prioritizationService.identifySkillGaps(
          userId,
          activityId,
        );
        return {
          employeeId: userId,
          name: user.name,
          role: user.role,
          rank: user.rank || 'Junior',
          rankScore: user.rankScore || 0,
          department: user.department_id?.name || 'General',
          globalScore: user.rankScore || 0,
          matchPercentage: Math.max(0, 100 - gap.length * 25),
          skillGaps: gap,
          contextScore: 0,
          recommendation_reason: '',
        };
      }),
    );

    // Apply intent-aware scoring from prioritization service
    const intentScored = this.prioritizationService.applyIntentAwareScoring(
      candidatesMeta,
      activity,
    );

    const rankedCandidates = intentScored.map((candidate: any) => {
      const nlpData = nlpScores.get(candidate.employeeId);

      // Blend weights depend on intent:
      // development: 50% gap/intent score + 30% NLP + 20% RF reliability
      // performance: 20% gap/intent score + 50% NLP + 30% RF reliability
      // balanced:    35% gap/intent score + 40% NLP + 25% RF reliability
      let finalScore: number;
      const intentScore = candidate.contextScore / 100; // normalise to [0,1]

      if (nlpData) {
        if (intent === 'development') {
          finalScore =
            intentScore * 0.5 + nlpData.nlpScore * 0.3 + nlpData.rfScore * 0.2;
        } else if (intent === 'performance') {
          finalScore =
            intentScore * 0.2 + nlpData.nlpScore * 0.5 + nlpData.rfScore * 0.3;
        } else {
          finalScore =
            intentScore * 0.35 +
            nlpData.nlpScore * 0.4 +
            nlpData.rfScore * 0.25;
        }
      } else {
        // Fallback when Python is offline
        finalScore = intentScore;
      }

      let promptBoost = 0;
      if (promptSkillSet.size > 0) {
        const userSkills =
          employeeSkillMap.get(candidate.employeeId) || new Set<string>();
        let missing = 0;
        for (const s of promptSkillSet) {
          if (!userSkills.has(s)) missing += 1;
        }

        // Prompt means "who should improve in these fields", so missing skills increase priority.
        promptBoost = Math.min(0.15, missing * 0.05);
        finalScore += promptBoost;

        if (missing > 0) {
          const improvementHint = `Prompt fit: needs improvement in ${missing} requested field${missing > 1 ? 's' : ''}.`;
          candidate.recommendation_reason = candidate.recommendation_reason
            ? `${candidate.recommendation_reason} ${improvementHint}`
            : improvementHint;
        }
      }

      // Use candidate.recommendation_reason if set, otherwise empty string
      return {
        userId: candidate.employeeId,
        name: candidate.name,
        role: candidate.role,
        department: candidate.department,
        score: Math.min(Math.max(finalScore, 0), 1),
        nlpScore: nlpData?.nlpScore ?? 0,
        rfScore: nlpData?.rfScore ?? 0,
        promptBoost: Math.round(promptBoost * 100) / 100,
        intentScore: Math.round(intentScore * 100) / 100,
        intent,
        yearsOfExperience:
          candidate.yearsOfExperience ||
          allUsers.find((e) => e._id.toString() === candidate.employeeId)
            ?.yearsOfExperience ||
          0,
        recommendation_reason: candidate.recommendation_reason || '',
        gap: candidate.skillGaps,
      };
    });

    let candidates = rankedCandidates.filter((c: any) => c !== null);

    // If frontend options are supplied, we use them for breaking ties or adding modifiers
    // This allows the slider for "skillPriority" to actually differentiate people correctly!
    if (Object.keys(options).length > 0) {
      if (options.experienceFilter > 0) {
        candidates = candidates.filter(
          (c: any) => c.yearsOfExperience >= options.experienceFilter,
        );
      }

      candidates = candidates.map((c: any) => {
        let adj = c.score * 100;
        const gapCount = c.gap.length;

        if (options.skillPriority === 'skills') {
          if (gapCount === 0) adj += 15;
          else adj -= gapCount * 5;
        } else if (options.skillPriority === 'experience') {
          if (c.yearsOfExperience > 5) adj += 10;
          if (c.yearsOfExperience > 10) adj += 10;
        } else if (options.skillPriority === 'growth') {
          if (gapCount > 0) adj += gapCount * 8;
        }

        if (options.priorityWeight > 0) {
          adj += options.priorityWeight * 0.1;
        }

        c.score = Math.max(0, Math.min(100, Math.round(adj))) / 100;
        return c;
      });
    }

    candidates = candidates.sort((a: any, b: any) => {
      // Primary: Score
      if (b.score !== a.score) return b.score - a.score;
      // Secondary tie breaker: Experience
      if (b.yearsOfExperience !== a.yearsOfExperience)
        return b.yearsOfExperience - a.yearsOfExperience;
      // Tertiary tie breaker: Fewest gaps
      return a.gap.length - b.gap.length;
    });

    if (options.seatsToFill && options.seatsToFill > 0) {
      candidates = candidates.slice(0, options.seatsToFill);
    }

    return {
      activity: {
        activityId: activity._id,
        title: activity.title,
        type: activity.type,
        intent,
        level: activity.level,
        date: activity.date,
        duration: activity.duration,
      },
      candidates,
    };
  }

  async extractSkillsFromDescription(
    description: string,
    title: string,
  ): Promise<any> {
    try {
      // Enhancement: fetch real skill names from MongoDB and pass them
      // to the Python NLP service so it uses dynamic vocabulary instead
      // of its hardcoded default list
      let knownSkills: string[] | undefined;
      try {
        // SkillsService is available via ActivitiesModule imports
        // Use the httpService to call our own skills API to get all skill names
        const skillsResponse = await firstValueFrom(
          this.httpService.get<any>('http://localhost:3001/api/skills'),
        );
        knownSkills = (skillsResponse.data || [])
          .map((s: any) => s.name)
          .filter(Boolean);
      } catch {
        // If skills fetch fails, Python will use its default vocabulary
        knownSkills = undefined;
      }

      const response = await firstValueFrom(
        this.httpService.post<any>('http://localhost:8000/extract-skills', {
          description,
          title,
          ...(knownSkills && knownSkills.length > 0 ? { knownSkills } : {}),
        }),
      );
      return response.data;
    } catch (error: any) {
      console.warn(
        '[ActivitiesService] NLP skill extraction unavailable:',
        error.message,
      );
      return { extractedSkills: [], confidence: 0 };
    }
  }
}
