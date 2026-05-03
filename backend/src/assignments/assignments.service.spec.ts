import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { Assignment } from './schema/assignment.schema';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { UsersService } from '../users/users.service';
import { ParticipationsService } from '../participations/participations.service';

describe('AssignmentsService', () => {
  let service: AssignmentsService;

  const mockNotificationCreate = jest.fn();
  const mockEmitToUser = jest.fn();

  const mockAssignmentModel: any = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  }));

  mockAssignmentModel.findOne = jest.fn();
  mockAssignmentModel.findById = jest.fn();
  mockAssignmentModel.findByIdAndDelete = jest.fn();

  const mockActivitiesService = {
    findOne: jest.fn(),
  };

  const mockNotificationsService = {
    create: mockNotificationCreate,
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockNotificationsGateway = {
    emitToUser: mockEmitToUser,
  };

  const mockParticipationsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        {
          provide: getModelToken(Assignment.name),
          useValue: mockAssignmentModel,
        },
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
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
          provide: NotificationsGateway,
          useValue: mockNotificationsGateway,
        },
        {
          provide: ParticipationsService,
          useValue: mockParticipationsService,
        },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
  });

  it('should return an existing assignment when the user is already assigned', async () => {
    const activityId = new Types.ObjectId().toHexString();
    const existingAssignment = { _id: new Types.ObjectId(), activityId };

    mockActivitiesService.findOne.mockResolvedValue({
      _id: activityId,
      workflowStatus: 'approved',
    });
    mockAssignmentModel.findOne.mockResolvedValue(existingAssignment);

    const result = await service.create(
      new Types.ObjectId().toHexString(),
      activityId,
      new Types.ObjectId().toHexString(),
    );

    expect(result).toBe(existingAssignment);
    expect(mockAssignmentModel).not.toHaveBeenCalledWith(expect.anything());
  });

  it('should create a new assignment for an approved activity', async () => {
    const userId = new Types.ObjectId().toHexString();
    const activityId = new Types.ObjectId().toHexString();
    const assignedBy = new Types.ObjectId().toHexString();
    const savedAssignment = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(userId),
      activityId: new Types.ObjectId(activityId),
      assignedBy: new Types.ObjectId(assignedBy),
    };

    mockActivitiesService.findOne.mockResolvedValue({
      _id: activityId,
      workflowStatus: 'approved',
    });
    mockAssignmentModel.findOne.mockResolvedValue(null);
    mockAssignmentModel.mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue(savedAssignment),
    }));

    const result = await service.create(userId, activityId, assignedBy);

    expect(result.userId.toString()).toBe(userId);
    expect(result.activityId.toString()).toBe(activityId);
    expect(result.assignedBy.toString()).toBe(assignedBy);
  });

  it('should forbid a manager from updating assignments owned by someone else', async () => {
    const assignmentId = new Types.ObjectId().toHexString();
    const managerId = new Types.ObjectId().toHexString();

    mockAssignmentModel.findById.mockReturnValue({
      _id: assignmentId,
      managerId: { _id: new Types.ObjectId().toHexString() },
      userId: new Types.ObjectId().toHexString(),
      activityId: { _id: new Types.ObjectId().toHexString(), title: 'Training' },
      populate: jest.fn().mockReturnThis(),
    });

    await expect(
      service.updateStatus(assignmentId, 'accepted', managerId),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should notify the candidate when a manager accepts an assignment', async () => {
    const assignmentId = new Types.ObjectId().toHexString();
    const managerId = new Types.ObjectId().toHexString();
    const candidateId = new Types.ObjectId().toHexString();
    const activityId = new Types.ObjectId().toHexString();
    const saveMock = jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    });

    mockAssignmentModel.findById.mockReturnValue({
      _id: assignmentId,
      managerId: { _id: managerId, name: 'Manager' },
      userId: candidateId,
      activityId: { _id: activityId, title: 'Leadership Workshop' },
      status: 'pending',
      reason: 'test',
      save: saveMock,
      populate: jest.fn().mockReturnThis(),
    });
    mockNotificationCreate.mockResolvedValue({
      _id: new Types.ObjectId(),
      title: 'Training Opportunity Identified',
      message: 'Manager Manager has recommended the activity "Leadership Workshop" for you. Click to view details and join.',
      type: 'recommendation_accepted',
      metadata: { activityId, assignmentId, managerId },
    });
    mockEmitToUser.mockReturnValue(true);

    const result = await service.updateStatus(assignmentId, 'accepted', managerId);

    expect(result.status).toBe('notified');
    expect(mockNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientId: candidateId,
        metadata: expect.objectContaining({
          activityId,
          assignmentId,
          managerId,
        }),
      }),
      { emitRealtime: false },
    );
    expect(mockEmitToUser).toHaveBeenCalledWith(
      candidateId,
      'newNotification',
      expect.objectContaining({
        recipientId: candidateId,
        metadata: expect.objectContaining({
          activityId,
          assignmentId,
          managerId,
        }),
      }),
    );
  });
});