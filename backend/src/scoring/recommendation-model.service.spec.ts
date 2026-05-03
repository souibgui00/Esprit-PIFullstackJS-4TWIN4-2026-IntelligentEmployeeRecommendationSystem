import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RecommendationModelService } from './recommendation-model.service';
import { PrioritizationService } from '../prioritization/prioritization.service';
import { Types } from 'mongoose';

describe('RecommendationModelService', () => {
  let service: RecommendationModelService;
  let prioritizationService: PrioritizationService;

  const mockUserModel = {
    findById: jest.fn(),
  };

  const mockActivityModel = {
    findById: jest.fn(),
  };

  const mockParticipationModel = {
    find: jest.fn(),
  };

  const mockPrioritizationService = {
    inferIntent: jest.fn().mockReturnValue('balanced'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendationModelService,
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
        {
          provide: PrioritizationService,
          useValue: mockPrioritizationService,
        },
      ],
    }).compile();

    service = module.get<RecommendationModelService>(RecommendationModelService);
    prioritizationService = module.get<PrioritizationService>(
      PrioritizationService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('predictScore', () => {
    it('should throw NotFoundException when user not found', async () => {
      mockUserModel.findById.mockResolvedValueOnce(null);

      await expect(
        service.predictScore('invalid-user-id', 'activity-id'),
      ).rejects.toThrow();
    });

    it('should throw NotFoundException when activity not found', async () => {
      mockUserModel.findById.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        name: 'Test User',
        skills: [],
      });
      mockActivityModel.findById.mockResolvedValueOnce(null);

      await expect(
        service.predictScore('user-id', 'invalid-activity-id'),
      ).rejects.toThrow();
    });

    it('should return a score between 0 and 1', async () => {
      const userId = new Types.ObjectId();
      const activityId = new Types.ObjectId();

      mockUserModel.findById.mockResolvedValueOnce({
        _id: userId,
        name: 'Test User',
        skills: [
          {
            skillId: { _id: new Types.ObjectId(), name: 'JavaScript' },
            etat: 'validated',
          },
        ],
        yearsOfExperience: 5,
        rankScore: 0.8,
      });

      mockActivityModel.findById.mockResolvedValueOnce({
        _id: activityId,
        title: 'Test Activity',
        requiredSkills: [
          {
            skillId: {
              _id: new Types.ObjectId(),
              name: 'JavaScript',
            },
          },
        ],
      });

      mockParticipationModel.find.mockResolvedValueOnce([]);

      const score = await service.predictScore(userId.toString(), activityId.toString());

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('getScoreBreakdown', () => {
    it('should return score breakdown with components', async () => {
      const userId = new Types.ObjectId();
      const activityId = new Types.ObjectId();

      mockUserModel.findById.mockResolvedValueOnce({
        _id: userId,
        name: 'Test User',
        skills: [],
        yearsOfExperience: 5,
        rankScore: 0.8,
      });

      mockActivityModel.findById.mockResolvedValueOnce({
        _id: activityId,
        title: 'Test Activity',
        requiredSkills: [],
      });

      mockParticipationModel.find.mockResolvedValueOnce([]);

      const breakdown = await service.getScoreBreakdown(
        userId.toString(),
        activityId.toString(),
      );

      expect(breakdown).toHaveProperty('overallScore');
      expect(breakdown).toHaveProperty('components');
      expect(breakdown).toHaveProperty('weights');
      expect(breakdown.components).toHaveProperty('contentScore');
      expect(breakdown.components).toHaveProperty('profileScore');
      expect(breakdown.components).toHaveProperty('collaborativeScore');
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});
