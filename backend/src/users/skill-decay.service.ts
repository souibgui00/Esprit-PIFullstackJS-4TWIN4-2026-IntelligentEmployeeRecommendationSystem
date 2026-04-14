import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from '../users/schema/user.schema';

/**
 * Skill Decay Engine
 *
 * Implements the "Skill Decay" concept described in the project report:
 * skills that are not updated or exercised over time gradually lose their score.
 *
 * Decay logic:
 *   - Runs every Sunday at midnight (configurable)
 *   - If a skill has not been updated in > 90 days  → apply a 5% decay
 *   - If a skill has not been updated in > 180 days → apply a 10% decay
 *   - Minimum score floor: 10 (skills never decay to 0 — they just stagnate)
 *   - Score is capped at max 120 (as defined by the schema)
 *   - Updates the `lastUpdated` field to mark the decay event
 */
@Injectable()
export class SkillDecayService {
  private readonly logger = new Logger(SkillDecayService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /**
   * Weekly cron job — runs every Sunday at 00:00
   * Decays skill scores for all users based on how long ago skills were last updated.
   */
  @Cron(CronExpression.EVERY_WEEK)
  async runWeeklySkillDecay(): Promise<void> {
    this.logger.log('[SkillDecay] Starting weekly skill decay job...');

    const now = new Date();
    const ninetyDaysAgo  = new Date(now.getTime() - 90  * 24 * 60 * 60 * 1000);
    const hundredEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const users = await this.userModel.find({}).exec();

    let totalDecayed = 0;
    let totalUsersAffected = 0;

    for (const user of users) {
      let modified = false;

      for (const skill of (user.skills || [])) {
        const lastUpdated: Date = skill.lastUpdated
          ? new Date(skill.lastUpdated)
          : new Date(0); // treat never-updated as very old

        let decayRate = 0;

        if (lastUpdated < hundredEightyDaysAgo) {
          decayRate = 0.10; // 10% decay — severely stale
        } else if (lastUpdated < ninetyDaysAgo) {
          decayRate = 0.05; // 5% decay — moderately stale
        }

        if (decayRate > 0) {
          const currentScore = skill.score ?? 0;
          const decayAmount  = Math.floor(currentScore * decayRate);
          const newScore     = Math.max(currentScore - decayAmount, 10); // floor at 10

          if (newScore !== currentScore) {
            skill.score = newScore;
            skill.lastUpdated = now; // mark as processed
            modified = true;
            totalDecayed++;
          }
        }
      }

      if (modified) {
        await user.save();
        totalUsersAffected++;
      }
    }

    this.logger.log(
      `[SkillDecay] Completed. ${totalDecayed} skills decayed across ${totalUsersAffected} users.`,
    );
  }

  /**
   * Manual trigger — callable from an admin endpoint for immediate execution / demo.
   * @returns Summary of the decay run
   */
  async triggerManualDecay(): Promise<{
    usersAffected: number;
    skillsDecayed: number;
    timestamp: string;
  }> {
    this.logger.log('[SkillDecay] Manual decay trigger invoked.');

    const now = new Date();
    const ninetyDaysAgo  = new Date(now.getTime() - 90  * 24 * 60 * 60 * 1000);
    const hundredEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const users = await this.userModel.find({}).exec();

    let totalDecayed = 0;
    let totalUsersAffected = 0;

    for (const user of users) {
      let modified = false;

      for (const skill of (user.skills || [])) {
        const lastUpdated: Date = skill.lastUpdated
          ? new Date(skill.lastUpdated)
          : new Date(0);

        let decayRate = 0;
        if (lastUpdated < hundredEightyDaysAgo) decayRate = 0.10;
        else if (lastUpdated < ninetyDaysAgo)   decayRate = 0.05;

        if (decayRate > 0) {
          const currentScore = skill.score ?? 0;
          const newScore     = Math.max(Math.floor(currentScore * (1 - decayRate)), 10);

          if (newScore !== currentScore) {
            skill.score = newScore;
            skill.lastUpdated = now;
            modified = true;
            totalDecayed++;
          }
        }
      }

      if (modified) {
        await user.save();
        totalUsersAffected++;
      }
    }

    return {
      usersAffected: totalUsersAffected,
      skillsDecayed: totalDecayed,
      timestamp: now.toISOString(),
    };
  }
}
