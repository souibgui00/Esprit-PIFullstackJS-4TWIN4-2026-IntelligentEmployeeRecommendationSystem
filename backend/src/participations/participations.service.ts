import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Participation } from './schema/participation.schema';
import { ActivitiesService } from '../activities/activities.service';
import { UsersService } from '../users/users.service';
import { ScoringService } from '../scoring/scoring.service';
import { SkillsService } from '../skills/skills.service';
import { EvaluationsService } from '../evaluations/evaluations.service';

@Injectable()
export class ParticipationsService {
  constructor(
    @InjectModel(Participation.name)
    private participationModel: Model<Participation>,
    private activitiesService: ActivitiesService,
    private usersService: UsersService,
    private scoringService: ScoringService,
    private skillsService: SkillsService,
    private evaluationsService: EvaluationsService,
  ) {}

  private normalizeManagerRating(value: number): number {
    const raw = Number(value);
    if (!Number.isFinite(raw) || raw <= 0) return 0;

    // Backward compatibility:
    // - 1..5 stays as-is
    // - 0..10 converts to 1..5
    // - 0..100 converts to 1..5
    if (raw <= 5) return Math.max(1, Math.min(5, raw));
    if (raw <= 10) return Math.max(1, Math.min(5, raw / 2));
    return Math.max(1, Math.min(5, raw / 20));
  }

  async create(userId: string, activityId: string): Promise<Participation> {
    const existing = await this.participationModel.findOne({
      userId: new Types.ObjectId(userId),
      activityId: new Types.ObjectId(activityId),
    });
    if (existing) return existing;

    // Perform capacity check and increment counter first
    // If this fails (BadRequestException / NotFoundException), it will bubble up
    await this.activitiesService.enroll(activityId);

    const participation = new this.participationModel({
      userId: new Types.ObjectId(userId),
      activityId: new Types.ObjectId(activityId),
    });

    try {
      return await participation.save();
    } catch (error) {
      // If saving fails, roll back the counter
      await this.activitiesService.unenroll(activityId);
      throw error;
    }
  }

  async findAll(): Promise<Participation[]> {
    return this.participationModel.find().populate('activityId').exec();
  }

  async findByUser(userId: string): Promise<Participation[]> {
    return this.participationModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('activityId')
      .exec();
  }

  async updateProgress(
    userId: string,
    activityId: string,
    progress: number,
    feedback?: number,
  ): Promise<any> {
    const oldParticipation = await this.participationModel.findOne({
      userId: new Types.ObjectId(userId),
      activityId: new Types.ObjectId(activityId),
    });
    const oldStatus = oldParticipation?.status;
    const oldFeedback = Number(oldParticipation?.feedback ?? 0);

    const safeProgress = Math.max(0, Math.min(100, Number(progress || 0)));
    const incomingFeedback =
      typeof feedback === 'number' ? Number(feedback) : Number.NaN;
    const safeFeedback = Number.isFinite(incomingFeedback)
      ? this.normalizeManagerRating(incomingFeedback)
      : oldFeedback;

    const status =
      safeProgress === 100
        ? 'completed'
        : safeProgress === 0
          ? 'started'
          : 'in_progress';
    const participation = await this.participationModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        activityId: new Types.ObjectId(activityId),
      },
      {
        progress: safeProgress,
        status,
        feedback: safeFeedback,
        lastUpdated: new Date(),
      },
      { new: true },
    );
    if (!participation)
      throw new NotFoundException('Participation record not found');

    // Automatically update user skill scores when activity is completed.
    // Re-apply if completion feedback changes to keep scores in sync.
    const shouldUpdateScores =
      status === 'completed' &&
      (oldStatus !== 'completed' || safeFeedback !== oldFeedback);

    let scoreUpdated = false;
    if (shouldUpdateScores) {
      try {
        // Use the more optimized and robust ScoringService update loop
        await this.scoringService.updateSkoresAfterParticipation(
          userId,
          activityId,
          safeFeedback * 20 || 50, // Scale 1..5 feedback back up to 0..100 for scoring
        );
        scoreUpdated = true;
      } catch (err) {
        console.error(
          '[ParticipationsService] Failed to dynamically update skills via ScoringService:',
          err,
        );
      }
    }

    return {
      ...participation.toObject(),
      scoreUpdated,
      appliedFeedback: safeFeedback,
    };
  }

  async remove(userId: string, activityId: string): Promise<void> {
    const result = await this.participationModel.deleteOne({
      userId: new Types.ObjectId(userId),
      activityId: new Types.ObjectId(activityId),
    });
    if (result.deletedCount > 0) {
      await this.activitiesService.unenroll(activityId);
    }
  }
  async markCompleteByEmployee(
    participationId: string,
    userId: string,
  ): Promise<Participation> {
    const participation = await this.participationModel.findOne({
      _id: participationId,
      userId: new Types.ObjectId(userId),
    });
    if (!participation) throw new NotFoundException('Participation not found');

    const updated = await this.participationModel.findByIdAndUpdate(
      participationId,
      { status: 'awaiting_manager', lastUpdated: new Date(), progress: 100 },
      { new: true },
    );

    if (!updated) throw new NotFoundException('Participation update failed');

    // Notify manager
    try {
      const employee = await this.usersService.findOne(userId);
      const activity = await this.activitiesService.findOne(
        participation.activityId.toString(),
      );
      let managerId = (employee as any)?.manager_id?.toString();
      if (!managerId) {
        const deptId = await this.usersService.findRawDepartmentId(userId);
        if (deptId) {
          const manager = await this.usersService.findDepartmentManager(deptId);
          if (manager) managerId = manager._id.toString();
        }
      }
      if (managerId && activity) {
        const notificationsModel =
          this.participationModel.db.model('Notification');
        await notificationsModel.create({
          recipientId: new Types.ObjectId(managerId),
          title: '📋 Validation Report Required',
          message: `${employee?.name} has completed "${activity.title}". Please validate their completion report.`,
          type: 'validation_required',
          metadata: {
            activityId: (activity as any)._id.toString(),
            participationId,
            userId,
          },
          read: false,
          createdAt: new Date(),
        });
      }
    } catch (err) {
      console.error(
        '[ParticipationsService] Failed to notify manager of employee completion:',
        err,
      );
    }

    return updated;
  }

  async getOrganizerPanel(activityId: string): Promise<Participation[]> {
    return this.participationModel
      .find({ activityId: new Types.ObjectId(activityId) })
      .populate('userId', 'name email avatar department_id')
      .exec();
  }

  async submitOrganizerReport(activityId: string, report: any[]) {
    let awaitingValidation = 0;
    let notCompleted = 0;

    for (const item of report) {
      const { participationId, completed, rating, note } = item;
      const participation =
        await this.participationModel.findById(participationId);
      if (!participation) continue;

      if (completed) {
        await this.participationModel.findByIdAndUpdate(participationId, {
          status: 'awaiting_manager',
          progress: 100,
          organizerRating: rating || 3,
          organizerNote: note || '',
          lastUpdated: new Date(),
        });
        awaitingValidation++;

        // Notify manager
        try {
          // Alternatively just find the manager directly
          let managerId = null;
          const employee = await this.usersService.findOne(
            participation.userId.toString(),
          );
          if (employee && (employee as any).manager_id) {
            managerId = (employee as any).manager_id.toString();
          } else if (employee && (employee as any).department_id) {
            const manager = await this.usersService.findDepartmentManager(
              (employee as any).department_id.toString(),
            );
            if (manager) managerId = manager._id.toString();
          }

          if (managerId) {
            const notificationsModel =
              this.participationModel.db.model('Notification');
            await notificationsModel.create({
              recipientId: new Types.ObjectId(managerId),
              title: '📋 Validation Report Required',
              message: `An organizer has submitted a completion report for ${(employee as any)?.name}. Please validate.`,
              type: 'validation_required',
              metadata: { participationId },
              read: false,
              createdAt: new Date(),
            });
          }
        } catch (e) {}
      } else {
        await this.participationModel.findByIdAndUpdate(participationId, {
          status: 'not_completed',
          organizerRating: rating || 0,
          organizerNote: note || '',
          lastUpdated: new Date(),
        });
        notCompleted++;
      }
    }

    return { awaitingValidation, notCompleted };
  }

  async getPendingManagerValidations(managerId: string) {
    console.log(
      `[ParticipationsService] Fetching pending validations for Manager: ${managerId}`,
    );
    const employeeIds =
      await this.usersService.findManagedEmployeeIds(managerId);
    console.log(
      `[ParticipationsService] Found ${employeeIds.length} team members:`,
      employeeIds,
    );

    if (!employeeIds || employeeIds.length === 0) {
      return [];
    }

    const results = await this.participationModel
      .find({
        userId: { $in: employeeIds },
        status: 'awaiting_manager',
      })
      .populate('userId', 'name email avatar department_id')
      .populate('activityId', 'title type level organizerId')
      .sort({ updatedAt: -1 })
      .exec();

    console.log(
      `[ParticipationsService] Returning ${results.length} pending validations`,
    );
    return results;
  }

  async getValidationReportData(participationId: string) {
    const participation =
      await this.participationModel.findById(participationId);
    if (!participation) throw new NotFoundException('Participation not found');

    // Query activity with required skills populated so we always get skill names
    const ActivityModel = this.participationModel.db.model('Activity');
    const activityRaw = (await ActivityModel.findById(participation.activityId)
      .populate('requiredSkills.skillId', 'name type category')
      .lean()
      .exec()) as any;

    const employee = await this.usersService.findOne(
      participation.userId.toString(),
    );

    let deptName = 'Unassigned';
    try {
      const deptId = await this.usersService.findRawDepartmentId(
        participation.userId.toString(),
      );
      if (deptId) {
        const DepartmentModel = this.participationModel.db.model('Department');
        const dept = await DepartmentModel.findById(deptId);
        if (dept) deptName = dept.name;
      }
    } catch {}

    // Fetch skill names if they're not already present
    const targetedSkills = await Promise.all(
      (activityRaw?.requiredSkills || []).map(async (req: any) => {
        const reqSkillAny = req.skillId;
        // After populate, skillId is either the full document or just an ObjectId
        const skillIdStr = reqSkillAny?._id
          ? reqSkillAny._id.toString()
          : reqSkillAny?.toString();

        // Priority for Skill Name:
        // 1. Directly from populated activity requiredSkills.skillId
        // 2. From the Skills Service
        // 3. From the employee's existing skill records
        let skillName: string | undefined = reqSkillAny?.name;

        if (!skillName && skillIdStr) {
          try {
            const doc = await this.skillsService.findOne(skillIdStr);
            if (doc) skillName = doc.name;
          } catch (e) {}
        }

        if (!skillName && employee) {
          const empSkill = employee.skills?.find(
            (s: any) =>
              s.skillId?._id?.toString() === skillIdStr ||
              s.skillId?.toString() === skillIdStr,
          );
          if (empSkill) {
            skillName = empSkill.skillId?.name || empSkill.name;
          }
        }

        if (!skillName) skillName = 'Unknown Skill';

        let currentScore = 0;
        const empSkillMatch = (employee?.skills as any[])?.find(
          (s: any) =>
            s.skillId?._id?.toString() === skillIdStr ||
            s.skillId?.toString() === skillIdStr,
        );
        if (empSkillMatch) {
          currentScore = empSkillMatch.score || 0;
        }

        return {
          skillId: skillIdStr,
          name: skillName,
          level: req.requiredLevel || req.level || 'beginner',
          currentScore,
        };
      }),
    );

    return {
      participationId,
      activity: {
        id: activityRaw?._id,
        title: activityRaw?.title || 'Unknown',
        type: activityRaw?.type,
        date: activityRaw?.date || activityRaw?.startDate,
        duration: activityRaw?.duration,
        targetedSkills,
      },
      employee: {
        id: employee?._id,
        name: employee?.name || 'Unknown',
        department: deptName,
        email: employee?.email || '',
      },
    };
  }

  async submitManagerValidation(
    participationId: string,
    managerId: string,
    isApproved: boolean,
    rating: number,
    comment: string,
    skillAssessments: Record<string, boolean>,
  ) {
    const participation =
      await this.participationModel.findById(participationId);
    if (!participation) throw new NotFoundException('Participation not found');

    const safeRating = Math.max(1, Math.min(5, Math.round(Number(rating))));

    if (!isApproved) {
      if (!comment || comment.trim().length === 0)
        throw new BadRequestException('A rejection reason is required');
      await this.participationModel.findByIdAndUpdate(participationId, {
        status: 'not_completed',
        managerRejectionReason: comment.trim(),
        lastUpdated: new Date(),
      });

      // Notify employee of rejection
      try {
        const activity = await this.activitiesService.findOne(
          participation.activityId.toString(),
        );
        const notificationsModel =
          this.participationModel.db.model('Notification');
        await notificationsModel.create({
          recipientId: participation.userId,
          title: '❌ Activity Validation Rejected',
          message: `Your completion of "${activity?.title}" was rejected. Reason: ${comment.trim()}`,
          type: 'validation_rejected',
          read: false,
          createdAt: new Date(),
        });
      } catch (err) {}

      return { success: true, status: 'rejected' };
    }

    if (!comment || comment.trim().length === 0)
      throw new BadRequestException('Manager evaluation comment is mandatory');

    await this.participationModel.findByIdAndUpdate(participationId, {
      status: 'validated',
      managerValidatedAt: new Date(),
      managerRating: safeRating,
      managerNote: comment.trim(),
      lastUpdated: new Date(),
    });

    // Calculate and apply specific skill updates
    let skillsUpdated = 0;
    try {
      for (const [skillId, isImproved] of Object.entries(skillAssessments)) {
        if (isImproved) {
          // Update score by a flat amount or ratio based on rating.
          // E.g. Rating 5 = +15 pts, Rating 4 = +10 pts, Rating 3 = +5 pts, Rating 1-2 = +0
          let scoreIncrease = 0;
          if (safeRating === 5) scoreIncrease = 15;
          else if (safeRating === 4) scoreIncrease = 10;
          else if (safeRating === 3) scoreIncrease = 5;

          if (scoreIncrease > 0) {
            try {
              const emp: any = await this.usersService.findOne(
                participation.userId.toString(),
              );
              if (emp) {
                const empSkill = emp.skills?.find(
                  (s: any) =>
                    s.skillId?._id?.toString() === skillId ||
                    s.skillId?.toString() === skillId,
                );
                const currentScore = empSkill?.score || 0;
                // Start from a baseline or 0 if they don't have it
                const baseLine = empSkill ? currentScore : 25;
                const newScore = Math.min(100, baseLine + scoreIncrease);

                // Update score and set progression equal to the increase amount
                // updateUserSkill in UsersService automatically creates the skill entry if it doesn't exist.
                await this.usersService.updateUserSkill(
                  participation.userId.toString(),
                  skillId,
                  {
                    score: newScore,
                    progression: scoreIncrease,
                    source: 'Validation Report',
                  },
                );
                skillsUpdated++;
              }
            } catch (err) {
              console.error(`Failed to apply skill update for ${skillId}`, err);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error applying skill assessments', err);
    }

    // Save Evaluation record for the profile feedback section
    try {
      await this.evaluationsService.create({
        employeeId: participation.userId,
        evaluatorId: new Types.ObjectId(managerId),
        activityId: participation.activityId,
        overallScore: safeRating * 20, // Convert 5 star to 100%
        status: 'approved',
        comment: comment.trim(),
        feedback: comment.trim(), // Both fields used in frontend
        skillEvaluations: Object.keys(skillAssessments).map((skillId) => ({
          skillId: new Types.ObjectId(skillId),
          newScore: skillAssessments[skillId] ? safeRating * 20 : 0,
        })),
        evaluationType: 'post-activity',
        date: new Date(),
      });
    } catch (err) {
      console.error('Failed to create Evaluation record:', err);
    }

    // Notify employee of approval
    try {
      const activity = await this.activitiesService.findOne(
        participation.activityId.toString(),
      );
      const notificationsModel =
        this.participationModel.db.model('Notification');
      await notificationsModel.create({
        recipientId: participation.userId,
        title: '🎓 Activity Completion Validated',
        message: `Your completion of "${activity?.title}" has been validated! ${skillsUpdated > 0 ? 'Your skill scores have been updated.' : ''}`,
        type: 'completion_validated',
        metadata: { activityId: participation.activityId.toString() },
        read: false,
        createdAt: new Date(),
      });
    } catch (err) {}

    return { success: true, status: 'validated', skillsUpdated };
  }
}
