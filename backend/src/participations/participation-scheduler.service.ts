import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Participation } from './schema/participation.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { ActivitiesService } from '../activities/activities.service';

/** Parses a duration string like "3 days", "1 week", "2h", "90 min" → days as a number */
function parseDurationToDays(duration: string): number {
  if (!duration) return 1;
  const d = duration.toLowerCase().trim();
  const num = parseFloat(d) || 1;
  if (d.includes('week')) return num * 7;
  if (d.includes('day')) return num;
  if (d.includes('hour') || d.includes('hr') || d.includes('h'))
    return num / 24;
  if (d.includes('min')) return num / 1440;
  return 1; // Fallback: 1 day
}

function computeActivityEndDate(dateStr: string, durationStr: string): Date {
  const start = new Date(dateStr);
  if (isNaN(start.getTime())) return new Date(0);
  const days = parseDurationToDays(durationStr);
  const endMs = start.getTime() + days * 24 * 60 * 60 * 1000;
  return new Date(endMs);
}

@Injectable()
export class ParticipationSchedulerService {
  private readonly logger = new Logger(ParticipationSchedulerService.name);

  constructor(
    @InjectModel(Participation.name)
    private readonly participationModel: Model<Participation>,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
    private activitiesService: ActivitiesService,
  ) {}

  // ─── Job 1: Employee Response Deadline (every 6 hours) ───────────────────

  @Cron(CronExpression.EVERY_6_HOURS)
  async handleResponseDeadlines(): Promise<void> {
    this.logger.log('[Scheduler] Checking employee response deadlines...');
    const now = new Date();
    const DAY_MS = 24 * 60 * 60 * 1000;

    const pendingParticipations = await this.participationModel
      .find({ status: 'pending_response' })
      .populate('activityId')
      .exec();

    for (const p of pendingParticipations) {
      const createdAt = (p as any).createdAt as Date;
      if (!createdAt) continue;

      const elapsedDays =
        (now.getTime() - new Date(createdAt).getTime()) / DAY_MS;

      // Auto-decline after 7 days
      if (elapsedDays >= 7) {
        this.logger.log(
          `[Scheduler] Auto-declining participation ${p._id} (${elapsedDays.toFixed(1)} days elapsed)`,
        );
        await this.participationModel.findByIdAndUpdate(p._id, {
          status: 'declined',
          declineReason:
            'No response within 7 days — automatically declined by system.',
          declinedAt: now,
          lastUpdated: now,
        });

        // Notify manager
        try {
          const employee = await this.usersService.findOne(p.userId.toString());
          const managerId = (employee as any)?.manager_id?.toString();
          const activity = p.activityId as any;
          if (managerId) {
            await this.notificationsService.create({
              recipientId: managerId,
              title: '⏰ Auto-Declined: No Response',
              message: `${employee?.name} did not respond to "${activity?.title}" within 7 days. They have been automatically removed.`,
              type: 'participation_auto_declined',
              metadata: {
                participationId: p._id.toString(),
                userId: p.userId.toString(),
              },
            });
          }
        } catch (err) {
          this.logger.error(
            `[Scheduler] Failed to notify manager of auto-decline: ${err}`,
          );
        }
        continue;
      }

      // Send reminder after 3 days (only once)
      if (elapsedDays >= 3 && !p.reminderSentAt) {
        this.logger.log(
          `[Scheduler] Sending response reminder for participation ${p._id}`,
        );
        const activity = p.activityId as any;
        await this.notificationsService.create({
          recipientId: p.userId.toString(),
          title: '⏳ Reminder: Respond to Activity',
          message: `Please respond to your assignment for "${activity?.title}". You have ${Math.ceil(7 - elapsedDays)} days left before it is auto-declined.`,
          type: 'response_reminder',
          metadata: {
            activityId: activity?._id?.toString(),
            participationId: p._id.toString(),
          },
        });

        await this.participationModel.findByIdAndUpdate(p._id, {
          reminderSentAt: now,
        });
      }
    }
  }

  // ─── Job 2: Activity End Date → Transition to awaiting_organizer ──────────

  @Cron(CronExpression.EVERY_HOUR)
  async handleActivityEndTransitions(): Promise<void> {
    this.logger.log(
      '[Scheduler] Checking activity end dates for completion transitions...',
    );
    const now = new Date();

    const allActivities = await this.activitiesService.findAll();

    for (const activity of allActivities) {
      if (!activity.date) continue;

      const endDate = computeActivityEndDate(
        activity.date,
        activity.duration || '1 day',
      );
      if (endDate > now) continue; // Activity hasn't ended yet

      // Update the activity status to completed now that it is finished
      try {
        await this.activitiesService.update((activity as any)._id.toString(), {
          status: 'completed',
          workflowStatus: 'completed',
        } as any);
        this.logger.log(
          `[Scheduler] Activity "${activity.title}" marked as completed.`,
        );
      } catch (err) {
        this.logger.error(
          `[Scheduler] Failed to mark activity ${(activity as any)._id} as completed: ${err}`,
        );
      }

      // Find all accepted/in_progress participations for this activity
      const participations = await this.participationModel
        .find({
          activityId: (activity as any)._id,
          status: { $in: ['accepted', 'in_progress'] },
        })
        .exec();

      if (participations.length === 0) continue;

      this.logger.log(
        `[Scheduler] Transitioning ${participations.length} participations to awaiting_organizer.`,
      );

      // Group employees by manager to notify each manager once
      const managerNotified = new Set<string>();

      for (const p of participations) {
        await this.participationModel.findByIdAndUpdate(p._id, {
          status: 'awaiting_organizer',
          awaitingOrganizerSince: now,
          lastUpdated: now,
        });

        // Find this employee's manager and notify them
        try {
          const employee = await this.usersService.findOne(p.userId.toString());
          const managerId = (employee as any)?.manager_id?.toString();
          if (managerId && !managerNotified.has(managerId)) {
            await this.notificationsService.create({
              recipientId: managerId,
              title: '📋 Attendance Report Required',
              message: `"${activity.title}" has ended. Please submit your attendance report for your enrolled employees.`,
              type: 'attendance_report_required',
              metadata: { activityId: activity._id.toString() },
            });
            managerNotified.add(managerId);
          }
        } catch (err) {
          this.logger.error(
            `[Scheduler] Failed to notify manager for activity ${activity._id}: ${err}`,
          );
        }
      }
    }
  }

  // ─── Job 3: Escalation Alerts (every 2 hours) ─────────────────────────────

  @Cron('0 */2 * * *')
  async handleEscalations(): Promise<void> {
    this.logger.log('[Scheduler] Running escalation check...');
    const now = new Date();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // Find all HR users (for alerts)
    const allUsers = await this.usersService.findAll();
    const hrUsers = allUsers.filter((u: any) => u.role?.toLowerCase() === 'hr');

    // ── Organizer (manager) overdue: >3 days no report → reminder, >5 days → HR alert
    const awaitingOrganizer = await this.participationModel
      .find({ status: 'awaiting_organizer' })
      .populate('activityId')
      .exec();

    for (const p of awaitingOrganizer) {
      if (!p.awaitingOrganizerSince) continue;
      const elapsed =
        (now.getTime() - new Date(p.awaitingOrganizerSince).getTime()) / DAY_MS;
      const activity = p.activityId as any;

      try {
        const employee = await this.usersService.findOne(p.userId.toString());
        const managerId = (employee as any)?.manager_id?.toString();

        if (elapsed >= 5) {
          // Escalate to HR
          for (const hr of hrUsers) {
            await this.notificationsService.create({
              recipientId: hr._id.toString(),
              title: '🚨 Overdue Attendance Report (5+ days)',
              message: `Manager has not submitted the attendance report for "${activity?.title}" for over 5 days.`,
              type: 'escalation_organizer_overdue',
              metadata: { activityId: activity?._id?.toString(), managerId },
            });
          }
        } else if (elapsed >= 3 && managerId) {
          // Send reminder to manager
          await this.notificationsService.create({
            recipientId: managerId,
            title: '⏰ Reminder: Attendance Report Overdue',
            message: `The attendance report for "${activity?.title}" is overdue. Please submit it as soon as possible.`,
            type: 'organizer_report_reminder',
            metadata: { activityId: activity?._id?.toString() },
          });
        }
      } catch (err) {
        this.logger.error(
          `[Scheduler] Escalation check failed for participation ${p._id}: ${err}`,
        );
      }
    }

    // ── Manager validation overdue: >48h → HR alert
    const awaitingManager = await this.participationModel
      .find({ status: 'awaiting_manager' })
      .populate('activityId')
      .exec();

    for (const p of awaitingManager) {
      if (!p.organizerSubmittedAt) continue;
      const elapsedHours =
        (now.getTime() - new Date(p.organizerSubmittedAt).getTime()) /
        (60 * 60 * 1000);

      if (elapsedHours >= 48) {
        const activity = p.activityId as any;
        for (const hr of hrUsers) {
          try {
            await this.notificationsService.create({
              recipientId: hr._id.toString(),
              title: '🚨 Manager Validation Overdue (48h)',
              message: `A completion for "${activity?.title}" has been awaiting manager validation for over 48 hours.`,
              type: 'escalation_manager_validation_overdue',
              metadata: {
                participationId: p._id.toString(),
                activityId: activity?._id?.toString(),
              },
            });
          } catch (err) {
            this.logger.error(
              `[Scheduler] Failed to send validation escalation alert: ${err}`,
            );
          }
        }
      }
    }
  }
}
