import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Participation } from './schema/participation.schema';
import { ActivitiesService } from '../activities/activities.service';
import { UsersService } from '../users/users.service';
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class ParticipationsService {
    constructor(
        @InjectModel(Participation.name) private participationModel: Model<Participation>,
        private activitiesService: ActivitiesService,
        private usersService: UsersService,
        private scoringService: ScoringService,
    ) { }

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
            activityId: new Types.ObjectId(activityId)
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
        return this.participationModel.find()
            .populate('activityId')
            .exec();
    }

    async findByUser(userId: string): Promise<Participation[]> {
        return this.participationModel.find({ userId: new Types.ObjectId(userId) })
            .populate('activityId')
            .exec();
    }

    async updateProgress(userId: string, activityId: string, progress: number, feedback?: number): Promise<any> {
        const oldParticipation = await this.participationModel.findOne({
            userId: new Types.ObjectId(userId),
            activityId: new Types.ObjectId(activityId)
        });
        const oldStatus = oldParticipation?.status;
        const oldFeedback = Number(oldParticipation?.feedback ?? 0);

        const safeProgress = Math.max(0, Math.min(100, Number(progress || 0)));
        const incomingFeedback =
            typeof feedback === 'number' ? Number(feedback) : Number.NaN;
        const safeFeedback = Number.isFinite(incomingFeedback)
            ? this.normalizeManagerRating(incomingFeedback)
            : oldFeedback;

        const status = safeProgress === 100 ? 'completed' : safeProgress === 0 ? 'started' : 'in_progress';
        const participation = await this.participationModel.findOneAndUpdate(
            {
                userId: new Types.ObjectId(userId),
                activityId: new Types.ObjectId(activityId)
            },
            { progress: safeProgress, status, feedback: safeFeedback, lastUpdated: new Date() },
            { new: true }
        );
        if (!participation) throw new NotFoundException('Participation record not found');

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
                  safeFeedback * 20 || 50 // Scale 1..5 feedback back up to 0..100 for scoring
                );
                scoreUpdated = true;
            } catch (err) {
                console.error('[ParticipationsService] Failed to dynamically update skills via ScoringService:', err);
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
            activityId: new Types.ObjectId(activityId)
        });
        if (result.deletedCount > 0) {
            await this.activitiesService.unenroll(activityId);
        }
    }
}
