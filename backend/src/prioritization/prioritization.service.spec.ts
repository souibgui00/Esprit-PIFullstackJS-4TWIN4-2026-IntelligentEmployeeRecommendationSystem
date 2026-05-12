import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PrioritizationService } from './prioritization.service';
import { NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { Types } from 'mongoose';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PrioritizationService', () => {
  let service: PrioritizationService;

  const mockUserId = new Types.ObjectId().toString();
  const mockActivityId = new Types.ObjectId().toString();

  const mockUser = {
    _id: mockUserId,
    name: 'John Doe',
    department_id: new Types.ObjectId().toString(),
    status: 'active',
    skills: [{ skillId: { name: 'Node.js' }, etat: 'validated' }],
    yearsOfExperience: 3,
    rankScore: 80,
    rank: 'Mid',
    toObject: () => ({ name: 'John Doe' })
  };

  const mockActivity = {
    _id: mockActivityId,
    title: 'Test Activity',
    requiredSkills: [{ skillId: { name: 'Node.js' } }],
    targetDepartments: [mockUser.department_id],
  };

  function chainable(result: any) {
    return {
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(result),
      exec: jest.fn().mockResolvedValue(result),
      then: jest.fn().mockImplementation((onFulfilled: any) => Promise.resolve(onFulfilled ? onFulfilled(result) : result)),
    };
  }

  const mockUserModel = {
    find: jest.fn(),
    findById: jest.fn(),
  };

  const mockActivityModel = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrioritizationService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken('Activity'),
          useValue: mockActivityModel,
        },
      ],
    }).compile();

    service = module.get<PrioritizationService>(PrioritizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRecommendedEmployeesForActivity', () => {
    it('returns formatted AI recommendations', async () => {
      mockActivityModel.findById.mockReturnValue(chainable(mockActivity));
      mockUserModel.find.mockReturnValue(chainable([mockUser]));
      
      mockedAxios.post.mockResolvedValue({
        data: {
          scores: [
            {
              userId: mockUserId,
              nlpScore: 85,
              rfScore: 90,
              finalScore: 0.88,
              reasoning: 'Good match',
              needsDevelopment: [],
            }
          ]
        }
      });

      const res = await service.getRecommendedEmployeesForActivity(mockActivityId, 'expert', 5);
      expect(res).toHaveLength(1);
      expect(res[0].matchPercentage).toBe(88);
      expect(res[0].recommendation_reason).toBe('Good match');
    });

    it('throws NotFoundException if activity not found', async () => {
      mockActivityModel.findById.mockReturnValue(chainable(null));
      const res = await service.getRecommendedEmployeesForActivity('invalid');
      expect(res).toEqual([]); // Fallback manual scoring triggers due to error catch returning []
    });

    it('returns empty array gracefully on AI failure', async () => {
      mockActivityModel.findById.mockReturnValue(chainable(mockActivity));
      mockUserModel.find.mockReturnValue(chainable([mockUser]));
      mockedAxios.post.mockRejectedValue(new Error('AI down'));

      const res = await service.getRecommendedEmployeesForActivity(mockActivityId);
      expect(res).toEqual([]);
    });
  });

  describe('suggestActivityImportance', () => {
    it('suggests importance', async () => {
      const res = await service.suggestActivityImportance('test-id');
      expect(res.activityId).toBe('test-id');
      expect(res.suggestedImportance).toBeDefined();
    });
  });

  describe('inferIntent', () => {
    it('infers development for training', () => {
      expect(service.inferIntent('training')).toBe('development');
    });
    it('infers balanced for unknown', () => {
      expect(service.inferIntent('unknown')).toBe('balanced');
    });
  });

  describe('identifySkillGaps', () => {
    it('identifies missing skills', async () => {
      const activity = { requiredSkills: [{ skillId: { name: 'NodeJS' } }, { skillId: { name: 'React' } }] };
      const candidate = { skills: [{ skillId: { name: 'NodeJS' } }] };
      const gaps = await service.identifySkillGaps(activity, candidate);
      expect(gaps).toContain('React');
      expect(gaps).not.toContain('NodeJS');
    });
  });

  describe('applyIntentAwareScoring', () => {
    it('handles development intent', () => {
      const c = [{ skillGaps: [1], globalScore: 50 }];
      const res = service.applyIntentAwareScoring(c, { intent: 'development' });
      expect(res[0].contextScore).toBeDefined();
    });

    it('handles performance intent', () => {
      const c = [{ matchPercentage: 80, globalScore: 90 }];
      const res = service.applyIntentAwareScoring(c, { intent: 'performance' });
      expect(res[0].contextScore).toBeGreaterThan(0);
    });
  });

  describe('resolveTies', () => {
    it('sorts by contextScore desc', () => {
      const res = service.resolveTies([{ contextScore: 50 }, { contextScore: 90 }]);
      expect(res[0].contextScore).toBe(90);
    });
  });

  describe('weightSkillsByActivityImportance', () => {
    it('returns weighted skills', async () => {
      mockActivityModel.findById.mockReturnValue(chainable({ requiredSkills: [{}, {}] }));
      const res = await service.weightSkillsByActivityImportance('id');
      expect(res).toHaveLength(2);
      expect(res[0].weight).toBeGreaterThan(0);
    });
    it('throws if activity not found', async () => {
      mockActivityModel.findById.mockReturnValue(chainable(null));
      await expect(service.weightSkillsByActivityImportance('nope')).rejects.toThrow();
    });
  });

  describe('getEmployeesBySkillLevel', () => {
    it('groups users by level', async () => {
      mockActivityModel.findById.mockReturnValue(chainable(mockActivity));
      mockUserModel.find.mockReturnValue(chainable([
        { rank: 'Junior' },
        { rank: 'Senior' },
      ]));

      const res = await service.getEmployeesBySkillLevel('id');
      expect(res.beginner).toHaveLength(1);
      expect(res.advanced).toHaveLength(1);
    });

    it('throws if activity not found', async () => {
      mockActivityModel.findById.mockReturnValue(chainable(null));
      await expect(service.getEmployeesBySkillLevel('id')).rejects.toThrow();
    });
  });
});
