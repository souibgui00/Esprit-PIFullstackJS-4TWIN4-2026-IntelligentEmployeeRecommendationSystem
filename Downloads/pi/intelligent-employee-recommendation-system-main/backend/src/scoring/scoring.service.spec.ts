import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ScoringService } from './scoring.service';
<<<<<<< HEAD
=======
import { Types } from 'mongoose';
>>>>>>> dd895aa (reverting old work)

describe('ScoringService', () => {
  let service: ScoringService;

  const mockUserModel = {
<<<<<<< HEAD
    findById: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      }),
      select: jest.fn().mockResolvedValue(null),
    }),
    findByIdAndUpdate: jest.fn().mockResolvedValue(null),
  };

  const mockActivityModel = {
    findById: jest.fn().mockResolvedValue(null),
  };

  const mockParticipationModel = {
    find: jest.fn().mockResolvedValue([]),
=======
    findById: jest.fn(),
  };

  const mockActivityModel = {
    findById: jest.fn(),
  };

  const mockParticipationModel = {
    find: jest.fn(),
>>>>>>> dd895aa (reverting old work)
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken('Activity'),
          useValue: mockActivityModel,
        },
        {
          provide: getModelToken('Participation'),
          useValue: mockParticipationModel,
        },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
<<<<<<< HEAD
    jest.clearAllMocks();
=======
>>>>>>> dd895aa (reverting old work)
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

<<<<<<< HEAD
  it('should have calculateSkillScore method', () => {
    expect(typeof service.calculateSkillScore).toBe('function');
  });

  it('should have getEmployeeSkillScores method', () => {
    expect(typeof service.getEmployeeSkillScores).toBe('function');
  });

  it('should have calculateGlobalActivityScore method', () => {
    expect(typeof service.calculateGlobalActivityScore).toBe('function');
  });

  it('should have getActivityMatchPercentage method', () => {
    expect(typeof service.getActivityMatchPercentage).toBe('function');
  });

  it('should have updateSkoresAfterParticipation method', () => {
    expect(typeof service.updateSkoresAfterParticipation).toBe('function');
  });

  it('should have getScoreAnalytics method', () => {
    expect(typeof service.getScoreAnalytics).toBe('function');
  });

  it('should have compareEmployeeScores method', () => {
    expect(typeof service.compareEmployeeScores).toBe('function');
=======
  describe('calculateSkillScore', () => {
    it('should calculate score correctly with experience bonus', async () => {
      const userId = new Types.ObjectId().toHexString();
      const skillId = 'skill1';
      const mockUser = {
        _id: userId,
        yearsOfExperience: 5,
        skills: [
          { skillId: 'skill1', level: 'intermediate', lastUpdated: new Date() }
        ]
      };

      mockUserModel.findById.mockResolvedValue(mockUser);

      const score = await service.calculateSkillScore(userId, skillId);
      // intermediate = 50, exp = 5*2=10, progression = 5 -> total 65
      expect(score).toBeGreaterThanOrEqual(60);
    });
  });

  describe('getActivityMatchPercentage', () => {
    it('should return 100% if all required skills are met', async () => {
      const userId = new Types.ObjectId().toHexString();
      const activityId = new Types.ObjectId().toHexString();
      
      const mockUser = {
        skills: [{ skillId: 'skill1', level: 'expert' }]
      };
      const mockActivity = {
        requiredSkills: [{ skillId: 'skill1', requiredLevel: 'intermediate' }]
      };

      mockUserModel.findById.mockResolvedValue(mockUser);
      mockActivityModel.findById.mockResolvedValue(mockActivity);

      const percentage = await service.getActivityMatchPercentage(userId, activityId);
      expect(percentage).toBe(100);
    });

    it('should return 0% if no skills match', async () => {
      const userId = new Types.ObjectId().toHexString();
      const activityId = new Types.ObjectId().toHexString();
      
      const mockUser = { skills: [] };
      const mockActivity = {
        requiredSkills: [{ skillId: 'skill1', requiredLevel: 'intermediate' }]
      };

      mockUserModel.findById.mockResolvedValue(mockUser);
      mockActivityModel.findById.mockResolvedValue(mockActivity);

      const percentage = await service.getActivityMatchPercentage(userId, activityId);
      expect(percentage).toBe(0);
    });
>>>>>>> dd895aa (reverting old work)
  });
});
