import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Skill } from './schema/skill.schema';
import { CreateSkillDto, UpdateSkillDto } from './dto/skills.dto';

@Injectable()
export class SkillsService {
    constructor(
        @InjectModel(Skill.name)
        private skillModel: Model<Skill>,
    ) { }

    async create(createSkillDto: CreateSkillDto): Promise<Skill> {
        const createdSkill = new this.skillModel(createSkillDto);
        return createdSkill.save();
    }

    async findAll(): Promise<Skill[]> {
        return this.skillModel.find().exec();
    }

    async findOne(id: string): Promise<Skill | null> {
        if (!id) return null;
        try {
            // Try as ObjectID first
            const doc = await this.skillModel.findById(id).exec();
            if (doc) return doc;
        } catch (e) {
            // Not a valid ObjectID or failed
        }
        
        // Fallback: search by exact name case-insensitive
        return this.skillModel.findOne({ name: { $regex: new RegExp(`^${id}$`, 'i') } }).exec();
    }

    async findByName(name: string): Promise<Skill | null> {
        return this.skillModel.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } }).exec();
    }

    async update(id: string, updateSkillDto: UpdateSkillDto): Promise<Skill | null> {
        return this.skillModel.findByIdAndUpdate(id, updateSkillDto, { new: true }).exec();
    }

    async remove(id: string): Promise<any> {
        return this.skillModel.findByIdAndDelete(id).exec();
    }

    async getGlobalSkillsDashboard(): Promise<any> {
        const UserModel = this.skillModel.db.model('User');
        const users = await UserModel.find({ role: { $ne: 'admin' } }).select('skills');

        const totalSkillsConfigured = await this.skillModel.countDocuments();

        const skillsMap = new Map<
            string,
            {
                totalScore: number;
                employeeCount: number;
                levels: Set<string>;
            }
        >();

        let totalScore = 0;
        let totalEvaluations = 0;

        const levelDistribution = {
            expert: 0,
            advanced: 0,
            intermediate: 0,
            beginner: 0,
        };

        const normalizeLevel = (level: string): 'expert' | 'advanced' | 'intermediate' | 'beginner' => {
            const normalized = String(level || '').toLowerCase();
            if (normalized === 'expert' || normalized === '4') return 'expert';
            if (normalized === 'advanced' || normalized === 'high' || normalized === '3') return 'advanced';
            if (normalized === 'intermediate' || normalized === 'medium' || normalized === '2') return 'intermediate';
            return 'beginner';
        };

        for (const user of users) {
            const userSkills = user.skills || [];
            for (const s of userSkills) {
                if (!s?.skillId) continue;

                const skillId = s.skillId.toString();
                const score = Number(s.score || 0);
                const level = normalizeLevel(String(s.level || 'beginner'));

                if (!skillsMap.has(skillId)) {
                    skillsMap.set(skillId, {
                        totalScore: 0,
                        employeeCount: 0,
                        levels: new Set<string>(),
                    });
                }

                const current = skillsMap.get(skillId)!;
                current.totalScore += score;
                totalScore += score;
                totalEvaluations += 1;

                // Count one employee once per skill.
                if (!current.levels.has(`${user._id}`)) {
                    current.employeeCount += 1;
                    current.levels.add(`${user._id}`);
                }

                levelDistribution[level] += 1;
            }
        }

        const skillIds = Array.from(skillsMap.keys());
        const skillDocs = skillIds.length
            ? await this.skillModel.find({ _id: { $in: skillIds } }).select('name category type')
            : [];
        const skillDocMap = new Map(skillDocs.map((doc: any) => [doc._id.toString(), doc]));

        const topSkills = skillIds
            .map((skillId) => {
                const agg = skillsMap.get(skillId)!;
                const doc = skillDocMap.get(skillId);
                if (!doc) return null;

                return {
                    skillId,
                    skillName: doc.name,
                    category: doc.category,
                    type: doc.type,
                    averageScore: agg.employeeCount > 0 ? agg.totalScore / agg.employeeCount : 0,
                    employeeCount: agg.employeeCount,
                };
            })
            .filter((item): item is NonNullable<typeof item> => Boolean(item))
            .sort((a, b) => b.averageScore - a.averageScore);

        const categoryDistributionMap = new Map<string, number>();
        for (const item of topSkills) {
            const category = item.category || 'General';
            categoryDistributionMap.set(category, (categoryDistributionMap.get(category) || 0) + 1);
        }

        const categoryDistribution = Array.from(categoryDistributionMap.entries())
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);

        const averageOrganizationScore = totalEvaluations > 0 ? totalScore / totalEvaluations : 0;

        return {
            totalSkillsConfigured,
            averageOrganizationScore,
            totalEvaluations,
            topSkills,
            levelDistribution,
            categoryDistribution,
        };
    }
}
