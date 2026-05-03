import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ActivitiesService } from './activities.service';
import { PrioritizationService } from '../prioritization/prioritization.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Types } from 'mongoose';
import { Activity } from './schema/activity.schema';
import { RecommendationModelService } from '../scoring/recommendation-model.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '../common/enums/role.enum';

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  const mockActivityId = new Types.ObjectId().toString();
  const mockUserId = new Types.ObjectId().toString();

  const mockActivity = {
    _id: mockActivityId,
    title: 'Leadership Workshop',
    description: 'Grow your leadership skills',
    workflowStatus: 'approved',
    createdBy: mockUserId,
    capacity: 10,
    enrolledCount: 5,
    save: jest.fn().mockResolvedValue(true),
  };

  function chainable(result: any) {
    const p = Promise.resolve(result) as any;
    p.populate = jest.fn().mockReturnValue(p);
    p.select = jest.fn().mockReturnValue(p);
    p.lean = jest.fn().mockReturnValue(p);
    p.sort = jest.fn().mockReturnValue(p);
    p.limit = jest.fn().mockReturnValue(p);
    p.exec = jest.fn().mockResolvedValue(result);
    return p;
  }

  const mockActivityModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    _id: mockActivityId,
    save: jest.fn().mockResolvedValue({ _id: mockActivityId, ...dto }),
  }));

  mockActivityModel.findById = jest.fn().mockReturnValue(chainable(mockActivity));
  mockActivityModel.find = jest.fn().mockReturnValue(chainable([mockActivity]));
  mockActivityModel.findByIdAndUpdate = jest.fn().mockReturnValue(chainable(mockActivity));
  mockActivityModel.findByIdAndDelete = jest.fn().mockReturnValue(chainable(mockActivity));
  mockActivityModel.countDocuments = jest.fn().mockResolvedValue(10);

  const mockParticipationModel = {
    find: jest.fn().mockReturnValue(chainable([])),
  };

  const mockAssignmentModel = {
    find: jest.fn().mockReturnValue(chainable([])),
  };

  const mockPrioritizationService = {
    inferIntent: jest.fn().mockReturnValue('development'),
    identifySkillGaps: jest.fn().mockResolvedValue(['Communication']),
  };

  const mockUsersService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({ _id: mockUserId, name: 'HR User', manager_id: new Types.ObjectId() }),
  };

  const mockNotificationsService = {
    create: jest.fn().mockResolvedValue({}),
  };

  const mockRecommendationModelService = {
    predictScore: jest.fn().mockResolvedValue(0.75),
  };

  const mockHttpService = {
    get: jest.fn().mockReturnValue(of({ data: { employees: [] } })),
    post: jest.fn().mockReturnValue(of({ data: { scores: [] } })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: getModelToken(Activity.name), useValue: mockActivityModel },
        { provide: getModelToken('Participation'), useValue: mockParticipationModel },
        { provide: getModelToken('Assignment'), useValue: mockAssignmentModel },
        { provide: PrioritizationService, useValue: mockPrioritizationService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: RecommendationModelService, useValue: mockRecommendationModelService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<ActivitiesService>(ActivitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('saves activity and notifies manager', async () => {
      const res = await service.create({ title: 'New Activity' } as any, mockUserId);
      expect(res.title).toBe('New Activity');
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns all for non-employee', async () => {
      const res = await service.findAll('admin');
      expect(res).toHaveLength(1);
    });

    it('filters for employee based on assignments', async () => {
      mockAssignmentModel.find.mockReturnValue(chainable([{ activityId: mockActivityId }]));
      const res = await service.findAll(Role.EMPLOYEE, mockUserId);
      expect(res).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates activity', async () => {
      const res = await service.update(mockActivityId, { title: 'Updated' } as any);
      expect(res).toBeDefined();
    });

    it('handles resubmission workflow', async () => {
      mockActivityModel.findById.mockResolvedValueOnce({ ...mockActivity, workflowStatus: 'rejected', rejectedBy: mockUserId });
      await service.update(mockActivityId, { title: 'Fixed' } as any);
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });
  });

  describe('enroll/unenroll', () => {
    it('enrolls user', async () => {
      const res = await service.enroll(mockActivityId);
      expect(res).toBeDefined();
    });

    it('throws if full', async () => {
      mockActivityModel.findById.mockResolvedValueOnce({ ...mockActivity, capacity: 5, enrolledCount: 5, workflowStatus: 'approved' });
      await expect(service.enroll(mockActivityId)).rejects.toThrow(BadRequestException);
    });

    it('unenrolls user', async () => {
      const res = await service.unenroll(mockActivityId);
      expect(res).toBeDefined();
    });
  });

  describe('approve/reject', () => {
    it('approves activity', async () => {
      const res = await service.approve(mockActivityId, mockUserId);
      expect(res).toBeDefined();
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });

    it('rejects activity', async () => {
      const res = await service.reject(mockActivityId, mockUserId, 'Too expensive');
      expect(res).toBeDefined();
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });
  });

  describe('analytics and eligible', () => {
    it('findPending', async () => {
      await service.findPending();
      expect(mockActivityModel.find).toHaveBeenCalledWith({ workflowStatus: 'pending_approval' });
    });

    it('findRecommendationEligible', async () => {
      await service.findRecommendationEligible(true);
      expect(mockActivityModel.find).toHaveBeenCalled();
    });
  });

  describe('recommendations', () => {
    it('getRecommendations for user', async () => {
      const res = await service.getRecommendations(mockUserId);
      expect(res).toBeDefined();
    });

    it('getRecommendationsForActivity', async () => {
      mockUsersService.findAll.mockResolvedValue([{ _id: 'u1', role: 'employee', skills: [] }]);
      const res = await service.getRecommendationsForActivity(mockActivityId);
      expect(res.candidates).toBeDefined();
    });
  });
});
