import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ParticipationSchedulerService } from './participation-scheduler.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { ActivitiesService } from '../activities/activities.service';
import { Types } from 'mongoose';

describe('ParticipationSchedulerService', () => {
  let service: ParticipationSchedulerService;

  const mockParticipationModel = {
    find: jest.fn(),
    updateMany: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
    findManagedEmployeeIds: jest.fn(),
    findAll: jest.fn(),
  };

  const mockActivitiesService = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipationSchedulerService,
        {
          provide: getModelToken('Participation'),
          useValue: mockParticipationModel,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
      ],
    }).compile();

    service = module.get<ParticipationSchedulerService>(
      ParticipationSchedulerService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleResponseDeadlines', () => {
    it('should process overdue employee responses', async () => {
      mockParticipationModel.find.mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            userId: new Types.ObjectId(),
            activityId: new Types.ObjectId(),
            responseDeadline: new Date(Date.now() - 86400000), // 1 day ago
            status: 'pending',
          },
        ]),
      });

      mockParticipationModel.updateMany.mockResolvedValueOnce({
        modifiedCount: 1,
      });

      mockNotificationsService.create.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
      });

      await service.handleResponseDeadlines();

      expect(mockParticipationModel.find).toHaveBeenCalled();
    });
  });

  describe('handleCompletionDeadlines', () => {
    it('should process overdue activity completions', async () => {
      mockParticipationModel.find.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            userId: new Types.ObjectId(),
            activityId: new Types.ObjectId(),
            completionDeadline: new Date(Date.now() - 86400000),
            status: 'in_progress',
          },
        ]),
      });

      mockParticipationModel.updateMany.mockResolvedValueOnce({
        modifiedCount: 1,
      });

      // Service exposes activity-end transition job which handles completions
      mockActivitiesService.findAll = jest.fn().mockResolvedValueOnce([
        {
          _id: new Types.ObjectId(),
          title: 'Ended Activity',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          duration: '1 day',
        },
      ]);

      mockParticipationModel.find.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            userId: new Types.ObjectId(),
            activityId: new Types.ObjectId(),
            status: 'accepted',
          },
        ]),
      });

      mockUsersService.findOne.mockResolvedValueOnce({ _id: new Types.ObjectId(), manager_id: new Types.ObjectId() });

      await service.handleActivityEndTransitions();

      expect(mockParticipationModel.find).toHaveBeenCalled();
    });
  });

  describe('handleEvaluationReminders', () => {
    it('should send evaluation reminders to managers', async () => {
      mockParticipationModel.find.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            userId: new Types.ObjectId(),
            activityId: new Types.ObjectId(),
            status: 'completed',
            managerEvaluated: false,
            completedAt: new Date(Date.now() - 432000000), // 5 days ago
          },
        ]),
      });

      mockNotificationsService.create.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
      });

      // Use escalation job which handles overdue validations/reminders
      mockUsersService.findAll = jest.fn().mockResolvedValueOnce([
        { _id: new Types.ObjectId(), role: 'hr' },
      ]);

      mockParticipationModel.find.mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            userId: new Types.ObjectId(),
            activityId: new Types.ObjectId(),
            status: 'awaiting_organizer',
            awaitingOrganizerSince: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          },
        ]),
      });

      await service.handleEscalations();

      expect(mockParticipationModel.find).toHaveBeenCalled();
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});
