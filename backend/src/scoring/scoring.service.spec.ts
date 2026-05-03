import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ScoringService } from './scoring.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('ScoringService', () => {
  let service: ScoringService;

  const mockSkillId = new Types.ObjectId().toString();
  const mockUserId = new Types.ObjectId().toString();
  const mockActivityId = new Types.ObjectId().toString();

  const mockUser = {
    _id: mockUserId,
    name: 'Test User',
    yearsOfExperience: 5,
    skills: [
      {
        skillId: mockSkillId,
        level: 'intermediate',
        score: 50,
        auto_eval: 80,
        hierarchie_eval: 90,
        lastUpdated: new Date(),
      },
    ],
    markModified: jest.fn(),
    save: jest.fn().mockResolvedValue(true),
    toObject: () => ({ name: 'Test User' }),
  };

  const mockActivity = {
    _id: mockActivityId,
    requiredSkills: [
      {
        skillId: mockSkillId,
        weight: 0.8,
        requiredLevel: 'advanced',
      },
    ],
  };

  function chainable(result: any) {
    return {
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue(result),
      exec: jest.fn().mockResolvedValue(result),
      then: jest.fn().mockImplementation((onFulfilled: any) => Promise.resolve(onFulfilled ? onFulfilled(result) : result)),
    };
  }

  const mockUserModel = {
    findById: jest.fn().mockReturnValue(chainable(mockUser)),
  };

  const mockActivityModel = {
    findById: jest.fn().mockReturnValue(chainable(mockActivity)),
  };

  const mockParticipationModel = {
    find: jest.fn().mockReturnValue(chainable([])),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: getModelToken('Activity'), useValue: mockActivityModel },
        { provide: getModelToken('Participation'), useValue: mockParticipationModel },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateSkillScore', () => {
    it('returns a calculated score', async () => {
      mockUserModel.findById.mockReturnValue(chainable(mockUser));
      const score = await service.calculateSkillScore(mockUserId, mockSkillId);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);
    });

    it('throws NotFoundException if user missing', async () => {
      mockUserModel.findById.mockReturnValue(chainable(null));
      await expect(service.calculateSkillScore('nope', mockSkillId)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if skill missing', async () => {
      mockUserModel.findById.mockReturnValue(chainable(mockUser));
      await expect(service.calculateSkillScore(mockUserId, 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEmployeeSkillScores', () => {
    it('returns an array of skill scores', async () => {
      mockUserModel.findById.mockReturnValue(chainable({
        ...mockUser,
        skills: [
          {
            skillId: { _id: mockSkillId, name: 'NodeJS', type: 'knowledge' },
            level: 'expert',
            auto_eval: 90,
            hierarchie_eval: 95,
            lastUpdated: new Date()
          }
        ]
      }));
      const scores = await service.getEmployeeSkillScores(mockUserId);
      expect(Array.isArray(scores)).toBe(true);
      expect(scores.length).toBe(1);
      expect(scores[0]).toHaveProperty('score');
    });

    it('returns empty array if user has no skills', async () => {
      mockUserModel.findById.mockReturnValue(chainable({ ...mockUser, skills: [] }));
      const scores = await service.getEmployeeSkillScores(mockUserId);
      expect(scores).toEqual([]);
    });
  });

  describe('calculateGlobalActivityScore', () => {
    it('calculates global score for an activity', async () => {
      mockUserModel.findById.mockReturnValue(chainable(mockUser));
      mockActivityModel.findById.mockReturnValue(chainable(mockActivity));
      
      const score = await service.calculateGlobalActivityScore(mockUserId, mockActivityId);
      expect(typeof score).toBe('number');
    });

    it('throws if user missing', async () => {
      mockUserModel.findById.mockReturnValue(chainable(null));
      await expect(service.calculateGlobalActivityScore('nope', mockActivityId)).rejects.toThrow(NotFoundException);
    });

    it('throws if activity missing', async () => {
      mockUserModel.findById.mockReturnValue(chainable(mockUser));
      mockActivityModel.findById.mockReturnValue(chainable(null));
      await expect(service.calculateGlobalActivityScore(mockUserId, 'nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActivityMatchPercentage', () => {
    it('calculates percentage of matching skills', async () => {
      mockUserModel.findById.mockReturnValue(chainable(mockUser)); // user has 'intermediate'
      mockActivityModel.findById.mockReturnValue(chainable(mockActivity)); // req is 'advanced'
      
      // user intermediate(2) < required advanced(3), so match should be 0%
      const pct = await service.getActivityMatchPercentage(mockUserId, mockActivityId);
      expect(pct).toBe(0);
    });

    it('returns 100 if no required skills', async () => {
      mockUserModel.findById.mockReturnValue(chainable(mockUser));
      mockActivityModel.findById.mockReturnValue(chainable({ ...mockActivity, requiredSkills: [] }));
      
      const pct = await service.getActivityMatchPercentage(mockUserId, mockActivityId);
      expect(pct).toBe(100);
    });
  });

  describe('updateSkoresAfterParticipation', () => {
    it('updates existing skills successfully', async () => {
      mockUserModel.findById.mockReturnValue(chainable(mockUser));
      mockActivityModel.findById.mockReturnValue(chainable(mockActivity));

      const res = await service.updateSkoresAfterParticipation(mockUserId, mockActivityId, 80);
      expect(res.feedbackRating).toBe(4); // 80 / 20 = 4
      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.markModified).toHaveBeenCalledWith('skills');
    });

    it('adds new skill if user missing required skill', async () => {
      mockUserModel.findById.mockReturnValue(chainable({ ...mockUser, skills: [] }));
      mockActivityModel.findById.mockReturnValue(chainable(mockActivity));

      const res = await service.updateSkoresAfterParticipation(mockUserId, mockActivityId, 90);
      expect(res.feedbackRating).toBe(4.5); 
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('throws BadRequestException for invalid feedback', async () => {
      mockUserModel.findById.mockReturnValue(chainable(mockUser));
      mockActivityModel.findById.mockReturnValue(chainable(mockActivity));

      await expect(service.updateSkoresAfterParticipation(mockUserId, mockActivityId, 150)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getScoreAnalytics', () => {
    it('returns structured analytics data', async () => {
      mockUserModel.findById.mockReturnValue(chainable({
        ...mockUser,
        skills: [
          {
            skillId: { _id: mockSkillId, name: 'NodeJS', type: 'knowledge' },
            level: 'expert',
            auto_eval: 90,
            hierarchie_eval: 95,
            lastUpdated: new Date()
          }
        ]
      }));

      const analytics = await service.getScoreAnalytics(mockUserId);
      expect(analytics.totalSkills).toBe(1);
      expect(analytics).toHaveProperty('categoryBreakdown');
      expect(analytics.categoryBreakdown).toHaveProperty('knowledge');
    });

    it('handles empty skills array', async () => {
      mockUserModel.findById.mockReturnValue(chainable({ ...mockUser, skills: [] }));
      const analytics = await service.getScoreAnalytics(mockUserId);
      expect(analytics.totalSkills).toBe(0);
      expect(analytics.averageScore).toBe(0);
    });
  });

  describe('compareEmployeeScores', () => {
    it('returns an array of comparisons', async () => {
      mockUserModel.findById.mockReturnValue(chainable({ ...mockUser, toObject: () => ({ name: 'Test' }) }));
      
      const res = await service.compareEmployeeScores([mockUserId, 'another_id']);
      expect(res).toHaveLength(2);
      expect(res[0]).toHaveProperty('scoreAnalytics');
    });
  });
});
