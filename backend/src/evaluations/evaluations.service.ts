import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Evaluation } from './schema/evaluation.schema';
import { UsersService } from '../users/users.service';

type SkillEvaluationEntry = {
  skillId?: Types.ObjectId | string;
  newScore?: number;
  newLevel?: string;
};

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectModel(Evaluation.name) private evaluationModel: Model<Evaluation>,
    private readonly usersService: UsersService,
  ) {}

  async create(data: any): Promise<Evaluation> {
    const evaluation = new this.evaluationModel(data);
    const saved = await evaluation.save();

    if (saved.status === 'approved') {
      await this.approve(saved._id.toString());
    }

    return saved;
  }

  async findAll(): Promise<Evaluation[]> {
    return this.evaluationModel.find().exec();
  }

  async findByEmployee(employeeId: string): Promise<Evaluation[]> {
    return this.evaluationModel
      .find({ employeeId: new Types.ObjectId(employeeId) })
      .populate('employeeId')
      .populate('activityId')
      .exec();
  }

  async findByManager(evaluatorId: string): Promise<Evaluation[]> {
    return this.evaluationModel
      .find({ evaluatorId: new Types.ObjectId(evaluatorId) })
      .populate('employeeId')
      .populate('activityId')
      .exec();
  }

  async update(id: string, data: Record<string, unknown>): Promise<Evaluation> {
    const updatePayload = { ...data, updatedAt: new Date() };
    const evaluation = await this.evaluationModel.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true },
    );

    if (!evaluation) throw new NotFoundException('Evaluation not found');

    if (data.status === 'approved') {
      await this.approve(id);
    }

    return evaluation;
  }

  async approve(id: string): Promise<void> {
    const evaluation = await this.evaluationModel.findById(id);
    if (!evaluation) return;

    const employeeId = evaluation.employeeId.toString();
    const skillEvaluations = (evaluation.skillEvaluations ||
      []) as SkillEvaluationEntry[];

    // Apply evaluated values to user skills and let UsersService recalculate the final score.
    for (const se of skillEvaluations) {
      const skillId = se.skillId ? se.skillId.toString() : '';
      if (!skillId) continue;

      const managerEvaluation = this.normalizeManagerRating(
        Number(se.newScore ?? 0),
      );
      const evaluatedLevel =
        typeof se.newLevel === 'string' ? se.newLevel : 'beginner';

      try {
        await this.usersService.updateUserSkill(employeeId, skillId, {
          level: evaluatedLevel,
          hierarchie_eval: managerEvaluation,
          etat: 'validated',
        });
      } catch {
        // If the evaluated skill does not exist yet, create it from the evaluation.
        await this.usersService.addSkillToUser(employeeId, {
          skillId,
          level: evaluatedLevel,
          auto_eval: 0,
          hierarchie_eval: managerEvaluation,
          etat: 'validated',
        });
      }
    }
  }

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

  async remove(id: string): Promise<void> {
    await this.evaluationModel.findByIdAndDelete(id).exec();
  }
}
