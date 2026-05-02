import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ActivitiesService } from './activities.service';
import { PrioritizationService } from '../prioritization/prioritization.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Types } from 'mongoose';
import { Activity } from './schema/activity.schema';
import { ScoringService } from '../scoring/scoring.service';
import { RecommendationModelService } from '../scoring/recommendation-model.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  const mockActivityModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    exec: jest.fn(),
  };

  const mockParticipationModel = {
    find: jest.fn(),
    exec: jest.fn(),
  };

  const mockAssignmentModel = {
    find: jest.fn(),
    exec: jest.fn(),
  };

  const mockPrioritizationService = {
    prioritizeCandidates: jest.fn(),
    inferIntent: jest.fn().mockReturnValue('development'),
    identifySkillGaps: jest.fn().mockResolvedValue([]),
    applyIntentAwareScoring: jest.fn().mockImplementation((c) => c),
  };

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
  };

  const mockScoringService = {
    calculateScores: jest.fn(),
  };

  const mockRecommendationModelService = {
    predictScore: jest.fn().mockResolvedValue(0.8),
  };

  const mockHttpService = {
    get: jest.fn().mockReturnValue(of({ data: { employees: [] } })),
    post: jest.fn().mockReturnValue(of({ data: { scores: [] } })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        {
          provide: getModelToken(Activity.name),
          useValue: mockActivityModel,
        },
        {
          provide: getModelToken('Participation'),
          useValue: mockParticipationModel,
        },
        {
          provide: getModelToken('Assignment'),
          useValue: mockAssignmentModel,
        },
        {
          provide: PrioritizationService,
          useValue: mockPrioritizationService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: ScoringService,
          useValue: mockScoringService,
        },
        {
          provide: RecommendationModelService,
          useValue: mockRecommendationModelService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRecommendationsForActivity', () => {
    it('should return recommended candidates for an activity', async () => {
      const activityId = new Types.ObjectId().toHexString();
      const mockActivity = {
        _id: activityId,
        title: 'Python Training',
        description: 'Advanced Python',
        requiredSkills: [],
        status: 'active',
        workflowStatus: 'approved',
      };

      const mockCandidates = [
        { _id: new Types.ObjectId(), name: 'John Doe', role: 'employee', skills: [] },
      ];

      mockActivityModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockActivity),
      });

      mockUsersService.findAll.mockResolvedValue(mockCandidates);
      
      mockParticipationModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });
      
      mockAssignmentModel.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getRecommendationsForActivity(activityId);

      expect(result).toBeDefined();
      expect(result.activity).toBeDefined();
    });
  });

  describe('approve', () => {
    it('should update activity workflowStatus to approved', async () => {
      const activityId = new Types.ObjectId().toHexString();
      const userId = new Types.ObjectId().toHexString();
      const mockActivity = { 
        _id: activityId, 
        workflowStatus: 'approved',
        createdBy: new Types.ObjectId(),
        title: 'Test'
      };

      mockActivityModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockActivity),
      });

      const result = await service.approve(activityId, userId);
      expect(result).toBeDefined();
      expect(result?.workflowStatus).toBe('approved');
      expect(mockActivityModel.findByIdAndUpdate).toHaveBeenCalled();
    });
  });
});
