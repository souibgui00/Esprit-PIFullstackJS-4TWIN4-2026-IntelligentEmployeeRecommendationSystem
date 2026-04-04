import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schema/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { EmailService } from '../common/services/email.service';


@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private emailService: EmailService,
  ) { }

  private readonly skillCategoryWeights: Record<string, number> = {
    knowledge: 0.5,
    knowhow: 0.3,
    softskill: 0.2,
  };

  private normalizeSkillCategory(rawType: string | undefined): string {
    const normalized = (rawType || 'knowledge').toLowerCase().replace(/[-_\s]/g, '');
    if (normalized === 'knowhow') return 'knowhow';
    if (normalized === 'softskill' || normalized === 'softskills') return 'softskill';
    if (normalized === 'knowledge') return 'knowledge';
    return 'knowledge';
  }

  private computeWeightedSkillScore(skills: any[]) {
    const categoryScores: Record<string, number[]> = {
      knowhow: [],
      softskill: [],
      knowledge: [],
    };

    (skills || []).forEach((s: any) => {
      const type = this.normalizeSkillCategory(s.skillId?.type);
      const score = Number(s.score || 0);
      categoryScores[type].push(score);
    });

    const getAvg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const categoryAverages = {
      knowhow: getAvg(categoryScores.knowhow),
      softskill: getAvg(categoryScores.softskill),
      knowledge: getAvg(categoryScores.knowledge),
    };

    let totalWeight = 0;
    let weightedSum = 0;

    Object.entries(this.skillCategoryWeights).forEach(([category, weight]) => {
      if (categoryScores[category].length > 0) {
        weightedSum += categoryAverages[category as keyof typeof categoryAverages] * weight;
        totalWeight += weight;
      }
    });

    const weightedScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

    return {
      weightedScore: Math.round(weightedScore * 10) / 10,
      categoryAverages: {
        knowhow: Math.round(categoryAverages.knowhow * 10) / 10,
        softskill: Math.round(categoryAverages.softskill * 10) / 10,
        knowledge: Math.round(categoryAverages.knowledge * 10) / 10,
      },
      categoryCounts: {
        knowhow: categoryScores.knowhow.length,
        softskill: categoryScores.softskill.length,
        knowledge: categoryScores.knowledge.length,
      },
      appliedWeights: this.skillCategoryWeights,
    };
  }

  private generateMatricule(role: string): string {
    const year = new Date().getFullYear();
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const normalizedRole = (role || 'EMPLOYEE').toUpperCase();

    let prefix = 'EMP';
    if (normalizedRole === 'ADMIN') prefix = 'ADM';
    else if (normalizedRole === 'MANAGER') prefix = 'MGR';

    return `${prefix}-${year}-${randomId}`;
  }

  async create(data: any) {
    // Generate matricule based on role if not provided
    if (!data.matricule) {
      data.matricule = this.generateMatricule(data.role);
    }

    let rawPassword: string | null = null;
    const isGoogleUser = !!data.isGoogleUser;

    if (!isGoogleUser) {
      // Only generate/hash a password for non-Google users
      rawPassword = data.password || Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(rawPassword!, salt);
    } else {
      // Google users get a random unusable password — they log in via OAuth only
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(Math.random().toString(36).slice(-16), salt);
    }

    // Set role to enum if provided as string
    if (typeof data.role === 'string') {
      data.role = data.role.toUpperCase() as Role;
    }

    // Clean up empty optional fields that might fail MongoId casting
    if (data.department_id === '' || data.department_id === 'none') data.department_id = null;
    if (data.manager_id === '' || data.manager_id === 'none') data.manager_id = null;

    let savedUser;
    try {
      const user = new this.userModel(data);
      savedUser = await user.save();
    } catch (error: any) {
      console.error('[UsersService.create] Error saving user:', error);
      throw new BadRequestException(`Failed to create user: ${error.message}`);
    }

    // Send credentials email only for manually created (non-Google) users
    if (!isGoogleUser && rawPassword) {
      this.emailService.sendNewUserCredentials(
        data.email,
        data.name,
        rawPassword,
        data.matricule,
      ).catch(err => {
        console.error('[UsersService] Failed to send credentials email:', err);
      });
    }

    const userObj = savedUser.toObject();
    const { password, ...userWithoutPassword } = userObj as any;
    return {
      ...userWithoutPassword,
      ...(rawPassword ? { generatedPassword: rawPassword } : {}),
    };
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    }).populate('skills.skillId');
  }

  async findAll(role?: string) {
    try {
      const filter: any = {};
      if (role) {
        filter.role = { $regex: new RegExp(`^${role}$`, 'i') };
      }

      return await this.userModel
        .find(filter)
        .populate('department_id', 'name code')
        .populate('skills.skillId')
        .select('-password');
    } catch (error: any) {
      console.warn('[UsersService] Population failed in findAll, falling back:', error.message);
      const filter: any = {};
      if (role) {
        filter.role = { $regex: new RegExp(`^${role}$`, 'i') };
      }
      return this.userModel.find(filter).select('-password');
    }
  }

  async findManagers() {
    return this.userModel.find({ role: { $regex: /^manager$/i } }).select('-password').exec();
  }

  async findDepartmentManager(departmentId: string) {
    // Strategy 1: Look up the Department document and use its manager_id field
    // This is the primary relationship: Department.manager_id → User
    let dept: any;
    try {
      dept = await this.userModel.db.model('Department').findById(departmentId).select('manager_id name').exec();
    } catch {
      dept = null;
    }

    if (dept?.manager_id) {
      const manager = await this.userModel
        .findById(dept.manager_id)
        .select('-password')
        .exec();
      if (manager && manager.role === Role.MANAGER) {
        return manager;
      }
    }

    // Strategy 2: Fallback - search for a User with role=MANAGER and department_id matching
    const fallbackManager = await this.userModel
      .findOne({
        department_id: new Types.ObjectId(departmentId),
        role: Role.MANAGER,
      })
      .select('-password')
      .exec();

    return fallbackManager || null;
  }

  async getManagerByDepartment(departmentId: string) {
    return this.findDepartmentManager(departmentId);
  }

  async findOne(id: string) {
    let user;
    try {
      user = await this.userModel
        .findById(id)
        .populate('department_id', 'name code')
        .populate('skills.skillId')
        .select('-password');
    } catch (error: any) {
      console.warn(`[UsersService] Population failed for user ${id}:`, error.message);
      user = await this.userModel.findById(id).select('-password');
    }

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    // Lazy migration/calculation for existing users
    if (user.skills?.length > 0 && (!user.rankScore || user.rankScore === 0)) {
      await this.recalculateRankScore(id);
      // Refresh to get new rankScore and rank
      user = await this.userModel
        .findById(id)
        .populate('department_id', 'name code')
        .populate('skills.skillId')
        .select('-password');
    }

    return user;
  }

  async update(id: string, data: UpdateUserDto) {
    const updateData: any = { ...data };

    // Ensure role and matricule are never set through the generic update path
    delete updateData.role;
    delete updateData.matricule;

    if (updateData.department_id === '' || updateData.department_id === 'none') updateData.department_id = null;
    if (updateData.manager_id === '' || updateData.manager_id === 'none') updateData.manager_id = null;

    // Hash password if it's being updated
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    let user;
    try {
      user = await this.userModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('department_id', 'name code')
        .populate('skills.skillId')
        .select('-password');
    } catch (error: any) {
      console.warn(`[UsersService] Update population failed for user ${id}:`, error.message);
      user = await this.userModel.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    }

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async updateRole(id: string, role: Role) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { role },
      { new: true },
    ).populate('department_id', 'name code')
      .populate('skills.skillId')
      .select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async saveResetToken(userId: string, token: string, expires: Date) {
    return this.userModel.findByIdAndUpdate(userId, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });
  }

  async findByResetToken(token: string) {
    return this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
  }

  async updatePassword(userId: string, newPassword: string) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    return this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');

    if (newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    return { message: 'Password changed successfully' };
  }

  // ─── Skill management ────────────────────────────────────────────────────────

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

  private calculateExperienceBonus(years: number): number {
    const safeYears = Math.max(0, Number(years) || 0);
    return Math.min(safeYears * 2, 20);
  }

  private calculateProgressionBonus(lastUpdated: Date): number {
    if (!lastUpdated) return 0;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return lastUpdated > sixMonthsAgo ? 5 : 0;
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

  private calculateWeightedFeedback(auto: number, manager: number): number {
    // Step 4: manager feedback rating (1..5) gives a bonus of rating * 2.
    const managerRating = this.normalizeManagerRating(manager);
    return managerRating * 2;
  }

  private calculateFinalSkillScore(level: string | number, years: number, lastUpdated: Date | null, auto: number, manager: number): number {
    const base = this.getLevelBaseScore(level);
    const exp = this.calculateExperienceBonus(years);
    const prog = lastUpdated ? this.calculateProgressionBonus(lastUpdated) : 0;
    const feedback = this.calculateWeightedFeedback(auto, manager);

    const skillScore = base + exp + prog + feedback;
    return Math.min(skillScore, 120);
  }

  private async recalculateRankScore(userId: string) {
    const user = await this.userModel.findById(userId).populate('skills.skillId');
    if (!user || !user.skills?.length) return;

    const { weightedScore: finalScore } = this.computeWeightedSkillScore(user.skills);

    // Update global rank
    let rank = 'Junior';
    if (finalScore > 95) rank = 'Expert';
    else if (finalScore > 75) rank = 'Senior';
    else if (finalScore > 45) rank = 'Mid';

    await this.userModel.findByIdAndUpdate(userId, {
      rankScore: finalScore,
      rank: rank
    });
  }

  async calculateEmployeeWeightedSkillScore(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('skills.skillId')
      .select('-password');

    if (!user) throw new NotFoundException('User not found');

    const weighted = this.computeWeightedSkillScore(user.skills || []);

    return {
      userId: user._id,
      name: user.name,
      email: user.email,
      matricule: user.matricule,
      rank: user.rank,
      rankScore: user.rankScore || 0,
      totalSkills: (user.skills || []).length,
      ...weighted,
    };
  }

  async calculateAllEmployeesWeightedSkillScores() {
    const users = await this.userModel
      .find({ role: Role.EMPLOYEE })
      .populate('skills.skillId')
      .select('-password');

    return users.map((user: any) => {
      const weighted = this.computeWeightedSkillScore(user.skills || []);

      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        matricule: user.matricule,
        rank: user.rank,
        rankScore: user.rankScore || 0,
        totalSkills: (user.skills || []).length,
        ...weighted,
      };
    });
  }

  async addSkillToUser(userId: string, skillData: any) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const skillId = skillData.skillId?.toString();
    const existing = user.skills?.find((s: any) => s.skillId?.toString() === skillId);
    if (existing) throw new BadRequestException('Skill already assigned');

    const score = this.calculateFinalSkillScore(
      skillData.level || 'beginner',
      user.yearsOfExperience || 0,
      null,
      skillData.auto_eval || 0,
      skillData.hierarchie_eval || 0
    );

    const newSkill = {
      skillId: new Types.ObjectId(skillId),
      level: skillData.level || 'beginner',
      score: skillData.score ?? score,
      auto_eval: skillData.auto_eval ?? 0,
      hierarchie_eval: skillData.hierarchie_eval ?? 0,
      lastUpdated: new Date(),
    };

    user.skills = [...(user.skills || []), newSkill];
    await user.save();
    await this.recalculateRankScore(userId);
    return this.findOne(userId);
  }

  async calculateSkillScore(userId: string, skillId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const skillIndex = user.skills?.findIndex((s: any) => s.skillId?.toString() === skillId);
    if (skillIndex === -1 || skillIndex === undefined) throw new NotFoundException('Skill not found');

    const skill = user.skills[skillIndex];
    const newScore = this.calculateFinalSkillScore(
      skill.level,
      user.yearsOfExperience || 0,
      skill.lastUpdated,
      skill.auto_eval,
      skill.hierarchie_eval
    );

    user.skills[skillIndex].score = newScore;
    user.markModified('skills');
    await user.save();

    return this.findOne(userId);
  }

  async updateUserSkill(userId: string, skillId: string, updateData: any) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const skillIndex = user.skills?.findIndex((s: any) => s.skillId?.toString() === skillId);
    if (skillIndex === -1 || skillIndex === undefined) throw new NotFoundException('Skill not found');

    const skill = user.skills[skillIndex];
    const mergedData = { ...skill, ...updateData };

    const newScore = this.calculateFinalSkillScore(
      mergedData.level,
      user.yearsOfExperience || 0,
      new Date(), // assuming update signifies progression
      mergedData.auto_eval,
      mergedData.hierarchie_eval
    );

    user.skills[skillIndex] = {
      ...mergedData,
      score: updateData.score ?? newScore,
      lastUpdated: new Date(),
    };

    user.markModified('skills');
    await user.save();
    await this.recalculateRankScore(userId);
    return this.findOne(userId);
  }

  async removeSkillFromUser(userId: string, skillId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.skills = (user.skills || []).filter((s: any) => s.skillId?.toString() !== skillId);
    user.markModified('skills');
    await user.save();
    return this.findOne(userId);
  }

  async calculateActivityScore(userId: string, activityId: string): Promise<number> {
    const user = await this.userModel.findById(userId);
    const ActivityModel = this.userModel.db.model('Activity');
    const activity = await ActivityModel.findById(activityId);

    if (!user || !activity) return 0;

    let totalScore = 0;
    const requiredSkills = activity.requiredSkills || [];

    for (const req of requiredSkills) {
      const userSkill = user.skills?.find(s => s.skillId?.toString() === req.skillId);
      const skillScore = userSkill ? (userSkill.score || 0) : 0;
      totalScore += skillScore * (req.weight || 0.5);
    }

    return totalScore;
  }

  async processActivityCompletion(userId: string, activityId: string, feedback: number): Promise<any> {
    const user = await this.userModel.findById(userId);
    const ActivityModel = this.userModel.db.model('Activity');
    const activity = await ActivityModel.findById(activityId);

    if (!user || !activity) return;

    const learningRate = 0.1;
    const managerRating = this.normalizeManagerRating(feedback);
    const requiredSkills = activity.requiredSkills || [];
    const progressionIncrease = 0.1;

    for (const req of requiredSkills) {
      const skillIndex = user.skills?.findIndex(s => s.skillId?.toString() === req.skillId);

      if (skillIndex !== -1 && skillIndex !== undefined) {
        const skill = user.skills[skillIndex];

        // Update score: Dynamic Update = Old + (Feedback * Weight * LearningRate)
        const increment = managerRating * (req.weight || 0.5) * learningRate;
        const newScore = Math.min((skill.score || 0) + increment, 100);

        // Update progression: Increase by 0.1, cap at 1
        const currentProgression = (skill.progression || 0);
        const newProgression = Math.min(currentProgression + progressionIncrease, 1);

        user.skills[skillIndex] = {
          ...skill,
          score: Math.round(newScore * 10) / 10,
          progression: Math.round(newProgression * 100) / 100,
          lastUpdated: new Date()
        };
      }
    }

    user.markModified('skills');
    await user.save();
    await this.recalculateRankScore(userId);

    return this.calculateActivityScore(userId, activityId);
  }

  async recomputeUserSkillScores(
    userId: string,
    options?: { normalizeCvBaseline?: boolean },
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const normalizeCvBaseline = options?.normalizeCvBaseline ?? true;
    let changedSkills = 0;

    user.skills = (user.skills || []).map((skill: any) => {
      const nextSkill = { ...skill };

      if (
        normalizeCvBaseline &&
        (nextSkill.etat || 'draft') === 'draft' &&
        Number(nextSkill.auto_eval || 0) === 50 &&
        Number(nextSkill.hierarchie_eval || 0) === 50 &&
        ['intermediate', 'medium', '2'].includes(String(nextSkill.level || '').toLowerCase())
      ) {
        nextSkill.level = 'beginner';
        nextSkill.auto_eval = 0;
        nextSkill.hierarchie_eval = 0;
      }

      const recomputedScore = this.calculateFinalSkillScore(
        nextSkill.level || 'beginner',
        user.yearsOfExperience || 0,
        nextSkill.lastUpdated || null,
        Number(nextSkill.auto_eval || 0),
        Number(nextSkill.hierarchie_eval || 0),
      );

      if (Number(nextSkill.score || 0) !== recomputedScore) {
        changedSkills += 1;
      }

      return {
        ...nextSkill,
        score: recomputedScore,
      };
    });

    user.markModified('skills');
    await user.save();
    await this.recalculateRankScore(userId);

    return {
      userId,
      changedSkills,
      totalSkills: user.skills?.length || 0,
      normalizedCvBaseline: normalizeCvBaseline,
    };
  }

  async recomputeAllUsersSkillScores(options?: { normalizeCvBaseline?: boolean }) {
    const users = await this.userModel.find().select('_id');
    const results = [] as any[];

    for (const user of users) {
      const result = await this.recomputeUserSkillScores(String(user._id), options);
      results.push(result);
    }

    return {
      processedUsers: results.length,
      totalChangedSkills: results.reduce((sum, r) => sum + (r.changedSkills || 0), 0),
      results,
    };
  }

  async calculateGlobalActivityScore(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const ParticipationModel = this.userModel.db.model('Participation');
    const ActivityModel = this.userModel.db.model('Activity');

    const completedParticipations = await ParticipationModel.find({
      userId: new Types.ObjectId(userId),
      status: 'completed',
    });

    let globalScore = 0;

    for (const part of completedParticipations) {
      const activity = await ActivityModel.findById(part.activityId);
      if (activity) {
        if (activity.level === 'beginner') globalScore += 10;
        else if (activity.level === 'intermediate') globalScore += 20;
        else if (activity.level === 'advanced') globalScore += 30;
        else globalScore += 10;
      }
    }

    return { userId, globalActivityScore: globalScore };
  }

  async getCombinedScore(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // 1. Global Activity Score
    const activityData = await this.calculateGlobalActivityScore(userId);
    const globalActivityScore = activityData.globalActivityScore;

    // 2. Average Skill Score
    let totalSkillScore = 0;
    const skillsCount = user.skills?.length || 0;
    if (skillsCount > 0) {
      user.skills.forEach((s: any) => {
        totalSkillScore += (s.score || 0);
      });
    }
    const averageSkillScore = skillsCount > 0 ? totalSkillScore / skillsCount : 0;

    // 3. Combined Logic - Ex: simple sum, or weighted average.
    // Let's use a sum of activity + avg skill score (can be adjusted as needed)
    const combinedScore = globalActivityScore + averageSkillScore;

    return {
      userId,
      globalActivityScore,
      averageSkillScore,
      combinedScore,
      totalSkills: skillsCount
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────

  async remove(id: string) {

    return this.userModel.findByIdAndDelete(id);
  }
}
