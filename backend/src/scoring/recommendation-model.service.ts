import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schema/user.schema';
import { Activity } from '../activities/schema/activity.schema';
import { PrioritizationService } from '../prioritization/prioritization.service';

/**
 * Hybrid Recommendation Model Service
 *
 * Predicts user-activity compatibility using a weighted hybrid of 3 components:
 *
 *   finalScore = (0.5 × contentScore)       ← cosine similarity on skill vectors
 *              + (0.3 × profileScore)        ← experience, progression, rank
 *              + (0.2 × collaborativeScore)  ← peer feedback weighted by similarity
 *
 * All components produce a value in [0, 1].
 * Collaborative score degrades to 0 when no participation history exists (day-1 safe).
 */
@Injectable()
export class RecommendationModelService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel('Activity') private activityModel: Model<Activity>,
    @InjectModel('Participation') private participationModel: Model<any>,
    private prioritizationService: PrioritizationService,
  ) {}

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Predict compatibility score for a user with an activity.
   * @returns Score between 0 and 1 (higher = better fit)
   */
  async predictScore(userId: string, activityId: string): Promise<number> {
    const [user, activity] = await Promise.all([
      this.userModel.findById(userId).populate('skills.skillId'),
      this.activityModel.findById(activityId),
    ]);

    if (!user) throw new NotFoundException(`User ${userId} not found`);
    if (!activity)
      throw new NotFoundException(`Activity ${activityId} not found`);

    const skillIds = this.buildSkillUniverse(user, activity);

    const contentScore = this.computeCosineSimilarity(user, activity, skillIds);
    const profileScore = this.computeProfileScore(user);
    const collaborativeScore = await this.computeCollaborativeScore(
      userId,
      activityId,
      user,
      skillIds,
    );

    const hybrid =
      0.5 * contentScore + 0.3 * profileScore + 0.2 * collaborativeScore;
    return Math.min(Math.max(hybrid, 0), 1);
  }

  /**
   * Full breakdown of each component for transparency / debugging.
   */
  async getScoreBreakdown(
    userId: string,
    activityId: string,
  ): Promise<{
    overallScore: number;
    components: {
      contentScore: number;
      profileScore: number;
      collaborativeScore: number;
      // legacy aliases kept for backward compatibility
      skillMatch: number;
      experience: number;
      progression: number;
      performance: number;
    };
    weights: { content: number; profile: number; collaborative: number };
    labels: { overall: string };
  }> {
    const [user, activity] = await Promise.all([
      this.userModel.findById(userId).populate('skills.skillId'),
      this.activityModel.findById(activityId),
    ]);

    if (!user) throw new NotFoundException(`User ${userId} not found`);
    if (!activity)
      throw new NotFoundException(`Activity ${activityId} not found`);

    const skillIds = this.buildSkillUniverse(user, activity);

    const contentScore = this.computeCosineSimilarity(user, activity, skillIds);
    const profileScore = this.computeProfileScore(user);
    const collaborativeScore = await this.computeCollaborativeScore(
      userId,
      activityId,
      user,
      skillIds,
    );

    const overallScore = Math.min(
      Math.max(
        0.5 * contentScore + 0.3 * profileScore + 0.2 * collaborativeScore,
        0,
      ),
      1,
    );

    return {
      overallScore,
      components: {
        contentScore,
        profileScore,
        collaborativeScore,
        // Legacy aliases (kept so existing UI code doesn't break)
        skillMatch: contentScore,
        experience: Math.min((user.yearsOfExperience || 0) / 15, 1),
        progression: this.avgProgression(user),
        performance: Math.min((user.rankScore || 0) / 120, 1),
      },
      weights: { content: 0.5, profile: 0.3, collaborative: 0.2 },
      labels: { overall: this.scoreLabel(overallScore) },
    };
  }

  // ─── Component α: Content-Based (Cosine Similarity) ──────────────────────────

  /**
   * Computes cosine similarity between the user's skill score vector
   * and the activity's required skill weight vector.
   *
   * userVector[i]     = user's score for skill i normalised to [0,1]  (÷ 120)
   * activityVector[i] = activity's weight for skill i normalised [0,1] (÷ 2.0)
   *
   * Returns 1.0 when the activity has NO required skills (no barrier to entry).
   */
  private computeCosineSimilarity(
    user: any,
    activity: any,
    skillIds: string[],
  ): number {
    const requiredSkills: any[] = activity.requiredSkills || [];

    // If no required skills → perfect content match (open to everyone)
    if (requiredSkills.length === 0) return 1;

    // Build lookup maps
    const levelScoreMap: Record<string, number> = {
      beginner: 25,
      intermediate: 50,
      advanced: 75,
      expert: 100,
    };

    const userMap = new Map<string, number>();
    for (const s of user.skills || []) {
      const id = s.skillId?._id?.toString() ?? s.skillId?.toString();
      if (id) {
        const baseScore = levelScoreMap[s.level] || 25;
        const feedbackBonus = Math.min(
          ((0.4 * (s.auto_eval || 0)) / 20 +
            (0.6 * (s.hierarchie_eval || 0)) / 20) *
            2,
          10,
        );
        const computedScore = Math.min(baseScore + feedbackBonus, 120);
        userMap.set(id, computedScore / 120);
      }
    }

    const activityMap = new Map<string, number>();
    for (const req of requiredSkills) {
      const id = req.skillId?.toString();
      if (id) activityMap.set(id, Math.min((req.weight || 0.5) / 2.0, 1));
    }

    let dot = 0,
      normU = 0,
      normA = 0;
    for (const skillId of skillIds) {
      const u = userMap.get(skillId) ?? 0;
      const a = activityMap.get(skillId) ?? 0;
      dot += u * a;
      normU += u * u;
      normA += a * a;
    }

    // If the activity has required skills but the user has NONE → 0
    if (normA === 0) return 0;
    if (normU === 0) return 0;

    return dot / (Math.sqrt(normU) * Math.sqrt(normA));
  }

  // ─── Component β: Profile Score ───────────────────────────────────────────────

  /**
   * Normalised profile score based on:
   *   30% experience (capped at 15 years = 1.0)
   *   30% average skill progression (0–1 stored on each skill)
   *   30% rank score (global weighted skill score, normalised ÷ 120)
   *   10% recency bonus (any skill updated in last 3 months)
   */
  private computeProfileScore(user: any): number {
    const skills: any[] = user.skills || [];

    // Factor 1: Experience (0–1)
    const expScore = Math.min((user.yearsOfExperience || 0) / 15, 1);

    // Factor 2: Average progression (0–1)
    const avgProg = this.avgProgression(user);

    // Factor 3: Rank score (0–1)
    const rankScore = Math.min((user.rankScore || 0) / 120, 1);

    // Factor 4: Recency bonus
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const hasRecentUpdate = skills.some(
      (sk) => sk.lastUpdated && new Date(sk.lastUpdated) > threeMonthsAgo,
    );
    const recencyBonus = hasRecentUpdate ? 1.0 : 0.5;

    return (
      0.3 * expScore + 0.3 * avgProg + 0.3 * rankScore + 0.1 * recencyBonus
    );
  }

  // ─── Component γ: Collaborative Filtering ────────────────────────────────────

  /**
   * Weighted average of peer feedback ratings, weighted by how similar each peer
   * is to the target user (using cosine similarity on skill vectors).
   *
   * collaborativeScore = Σ(sim(user, peer) × normalisedFeedback) / Σ(sim)
   *
   * Returns 0 if no participation history exists (graceful degradation).
   */
  private async computeCollaborativeScore(
    userId: string,
    activityId: string,
    targetUser: any,
    skillIds: string[],
  ): Promise<number> {
    // All peers who completed this activity and left feedback
    const peers = await this.participationModel
      .find({
        activityId,
        status: 'completed',
        feedback: { $gt: 0 },
        userId: { $ne: targetUser._id }, // exclude self
      })
      .select('userId feedback')
      .lean();

    if (peers.length === 0) return 0;

    // ── Batch-load all peer users in ONE query (fixes N+1) ──────────────────
    const peerIds = peers.map((p) => p.userId);
    const peerUsers = await this.userModel
      .find({ _id: { $in: peerIds } })
      .populate('skills.skillId')
      .lean();

    const peerMap = new Map<string, any>(
      peerUsers.map((u: any) => [u._id.toString(), u]),
    );
    // ────────────────────────────────────────────────────────────────────────

    let weightedFeedbackSum = 0;
    let similaritySum = 0;

    for (const peer of peers) {
      const peerUser = peerMap.get(peer.userId?.toString());
      if (!peerUser) continue;

      // Build a fake "activity" from the peer's skill scores to reuse cosine similarity
      const peerAsActivity = {
        requiredSkills: (peerUser.skills || []).map((s: any) => ({
          skillId: s.skillId?._id?.toString() ?? s.skillId?.toString(),
          weight: Math.min((s.score || 0) / 120, 1) * 2, // scale back to [0, 2]
        })),
      };

      const sim = this.computeCosineSimilarity(
        targetUser,
        peerAsActivity,
        skillIds,
      );

      // Normalise feedback from [0, 10] → [0, 1]
      const normFeedback = Math.min((peer.feedback || 0) / 10, 1);

      weightedFeedbackSum += sim * normFeedback;
      similaritySum += sim;
    }

    if (similaritySum === 0) return 0;
    return Math.min(weightedFeedbackSum / similaritySum, 1);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  /**
   * Union of skill IDs from the user's profile and the activity's required skills.
   * This forms the coordinate space for cosine similarity.
   */
  private buildSkillUniverse(user: any, activity: any): string[] {
    const ids = new Set<string>();

    for (const s of user?.skills || []) {
      const id = s.skillId?._id?.toString() ?? s.skillId?.toString();
      if (id) ids.add(id);
    }

    for (const req of activity?.requiredSkills || []) {
      const id = req.skillId?.toString();
      if (id) ids.add(id);
    }

    return Array.from(ids);
  }

  /** Average skill.progression across all of a user's skills, normalised to [0, 1] */
  private avgProgression(user: any): number {
    const skills: any[] = user.skills || [];
    if (skills.length === 0) return 0;
    const total = skills.reduce((s, sk) => s + (sk.progression || 0), 0);
    // progression is stored as 0–1 (from processActivityCompletion), already normalised
    return Math.min(total / skills.length, 1);
  }

  /** Human-readable label for a score */
  private scoreLabel(score: number): string {
    if (score >= 0.85) return 'Top Pick';
    if (score >= 0.7) return 'Highly Recommended';
    if (score >= 0.5) return 'Recommended';
    if (score >= 0.05) return 'Consider';
    return 'Not Relevant';
  }
}
