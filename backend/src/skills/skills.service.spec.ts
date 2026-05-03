import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { Skill } from './schema/skill.schema';
import { Types } from 'mongoose';

describe('SkillsService', () => {
  let service: SkillsService;

  const mockSkillId = new Types.ObjectId().toHexString();

  const mockSkill = {
    _id: mockSkillId,
    name: 'NestJS',
    type: 'technique',
    etat: 'validated',
    description: 'Backend framework for Node.js',
    category: 'Backend',
    auto_eval: 4,
    hierarchie_eval: 4,
  };

  const mockSkillModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    db: {
      model: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([]),
        }),
      }),
    },
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        {
          provide: getModelToken(Skill.name),
          useValue: mockSkillModel,
        },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should have create method', () => {
      expect(typeof service.create).toBe('function');
    });
  });

  describe('findAll', () => {
    it('should return array of all skills', async () => {
      const skills = [mockSkill, { ...mockSkill, _id: new Types.ObjectId(), name: 'TypeScript' }];
      mockSkillModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(skills),
      });

      const result = await service.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('NestJS');
    });

    it('should return empty array if no skills', async () => {
      mockSkillModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await service.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should find skill by valid ObjectID', async () => {
      mockSkillModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      const result = await service.findOne(mockSkillId);

      expect(result).toEqual(mockSkill);
    });

    it('should return null if skill not found', async () => {
      mockSkillModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockSkillModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findOne(new Types.ObjectId().toHexString());

      expect(result).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find skill by name case-insensitive', async () => {
      mockSkillModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      const result = await service.findByName('nestjs');

      expect(result).toEqual(mockSkill);
      expect(mockSkillModel.findOne).toHaveBeenCalled();
    });

    it('should return null if skill not found', async () => {
      mockSkillModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findByName('NonexistentSkill');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update skill successfully', async () => {
      const updatedSkill = { ...mockSkill, description: 'Updated description' };
      mockSkillModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedSkill),
      });

      const result = await service.update(mockSkillId, {
        description: 'Updated description',
      });

      expect(result).toEqual(updatedSkill);
      expect(mockSkillModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should return null if skill to update not found', async () => {
      mockSkillModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.update(new Types.ObjectId().toHexString(), {
        name: 'UpdatedName',
      });

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete skill successfully', async () => {
      mockSkillModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSkill),
      });

      const result = await service.remove(mockSkillId);

      expect(result).toEqual(mockSkill);
      expect(mockSkillModel.findByIdAndDelete).toHaveBeenCalledWith(mockSkillId);
    });

    it('should handle deletion of nonexistent skill gracefully', async () => {
      mockSkillModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.remove(new Types.ObjectId().toHexString());

      expect(result).toBeNull();
    });
  });

  describe('getGlobalSkillsDashboard', () => {
    it('should aggregate global skills correctly', async () => {
      // Mock Users
      const mockUserModelFind = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            skills: [
              { skillId: mockSkillId, score: 80, level: 'expert' },
              { skillId: mockSkillId, score: 60, level: 'advanced' }, // Second occurrence for same user to test uniqueness logic
              { skillId: new Types.ObjectId().toHexString(), score: 40, level: 'beginner' } // Another skill
            ]
          },
          {
            _id: new Types.ObjectId(),
            skills: [
              { skillId: mockSkillId, score: 50, level: 'intermediate' }
            ]
          }
        ])
      });

      mockSkillModel.db.model.mockReturnValue({ find: mockUserModelFind });
      mockSkillModel.countDocuments.mockResolvedValue(10);
      
      mockSkillModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([
          { _id: mockSkillId, name: 'NestJS', category: 'Backend', type: 'Framework' }
        ]),
        exec: jest.fn()
      });

      const result = await service.getGlobalSkillsDashboard();

      expect(result.totalSkillsConfigured).toBe(10);
      expect(result.totalEvaluations).toBe(4);
      expect(result.averageOrganizationScore).toBe(230 / 4); // 80+60+40+50 = 230
      
      // Top skills array
      expect(result.topSkills.length).toBeGreaterThan(0);
      const topSkill = result.topSkills.find((s: any) => s.skillId === mockSkillId);
      expect(topSkill).toBeDefined();
      expect(topSkill.employeeCount).toBe(2); // 2 distinct users
      expect(topSkill.averageScore).toBe(190 / 2); // 80+60+50 = 190 total score / 2 users
      
      // Category Distribution
      expect(result.categoryDistribution).toEqual(expect.arrayContaining([
        expect.objectContaining({ category: 'Backend' })
      ]));

      // Level Distribution
      expect(result.levelDistribution.expert).toBe(1);
      expect(result.levelDistribution.advanced).toBe(1);
      expect(result.levelDistribution.intermediate).toBe(1);
      expect(result.levelDistribution.beginner).toBe(1);
    });

    it('should handle empty skills gracefully', async () => {
      mockSkillModel.db.model.mockReturnValue({
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([])
        })
      });
      mockSkillModel.countDocuments.mockResolvedValue(0);

      const result = await service.getGlobalSkillsDashboard();
      expect(result.totalEvaluations).toBe(0);
      expect(result.averageOrganizationScore).toBe(0);
      expect(result.topSkills).toHaveLength(0);
    });
  });
});
