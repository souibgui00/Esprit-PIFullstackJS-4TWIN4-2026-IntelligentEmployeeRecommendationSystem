import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AssignmentsService } from './assignments.service';
import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { ParticipationsService } from '../participations/participations.service';
import { UsersService } from '../users/users.service';
import { Types } from 'mongoose';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Role } from '../common/enums/role.enum';

describe('AssignmentsService', () => {
  let service: AssignmentsService;

  const mockAssignmentId = new Types.ObjectId().toString();
  const mockUserId = new Types.ObjectId().toString();
  const mockManagerId = new Types.ObjectId().toString();
  const mockActivityId = new Types.ObjectId().toString();

  const mockAssignment = {
    _id: mockAssignmentId,
    userId: mockUserId,
    activityId: mockActivityId,
    assignedBy: mockManagerId,
    managerId: mockManagerId,
    status: 'pending',
    type: 'recommendation',
    save: jest.fn().mockResolvedValue(true),
  };

  function chainable(result: any) {
    const p = Promise.resolve(result) as any;
    p.populate = jest.fn().mockReturnValue(p);
    p.select = jest.fn().mockReturnValue(p);
    p.skip = jest.fn().mockReturnValue(p);
    p.limit = jest.fn().mockReturnValue(p);
    p.exec = jest.fn().mockResolvedValue(result);
    return p;
  }

  const mockAssignmentModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    _id: mockAssignmentId,
    save: jest.fn().mockResolvedValue({ _id: mockAssignmentId, ...dto }),
  }));

  mockAssignmentModel.find = jest.fn().mockReturnValue(chainable([]));
  mockAssignmentModel.findOne = jest.fn().mockReturnValue(chainable(null));
  mockAssignmentModel.findById = jest.fn().mockReturnValue(chainable(mockAssignment));
  mockAssignmentModel.findByIdAndUpdate = jest.fn().mockReturnValue(chainable(mockAssignment));
  mockAssignmentModel.findByIdAndDelete = jest.fn().mockReturnValue(chainable(mockAssignment));

  const mockActivitiesService = {
    findOne: jest.fn().mockResolvedValue({ _id: mockActivityId, workflowStatus: 'approved', title: 'Test' }),
  };

  const mockNotificationsService = {
    create: jest.fn().mockResolvedValue({ _id: 'notif1', title: 'T', message: 'M' }),
  };

  const mockUsersService = {
    findOne: jest.fn().mockResolvedValue({ _id: mockUserId, name: 'User', role: Role.MANAGER }),
    findRawDepartmentId: jest.fn().mockResolvedValue(new Types.ObjectId().toString()),
    getManagerByDepartment: jest.fn().mockResolvedValue({ _id: mockManagerId, name: 'Manager', role: Role.MANAGER }),
  };

  const mockNotificationsGateway = {
    emitToUser: jest.fn().mockReturnValue(true),
  };

  const mockParticipationsService = {
    create: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAssignmentModel.find.mockReturnValue(chainable([]));
    mockAssignmentModel.findOne.mockReturnValue(chainable(null));
    mockAssignmentModel.findById.mockReturnValue(chainable(mockAssignment));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        { provide: getModelToken('Assignment'), useValue: mockAssignmentModel },
        { provide: ActivitiesService, useValue: mockActivitiesService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: NotificationsGateway, useValue: mockNotificationsGateway },
        { provide: ParticipationsService, useValue: mockParticipationsService },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a new assignment', async () => {
      const res = await service.create(mockUserId, mockActivityId, mockManagerId);
      expect(res).toBeDefined();
    });

    it('throws if activity unapproved', async () => {
      mockActivitiesService.findOne.mockResolvedValueOnce({ workflowStatus: 'pending' } as any);
      await expect(service.create(mockUserId, mockActivityId, mockManagerId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('forwardToManager', () => {
    it('forwards recommendations and notifies', async () => {
      const res = await service.forwardToManager({
        candidateIds: [mockUserId],
        activityId: mockActivityId,
        managerId: mockManagerId,
      }, 'admin1');
      expect(res.success).toBe(true);
      expect(mockNotificationsService.create).toHaveBeenCalled();
      expect(mockNotificationsGateway.emitToUser).toHaveBeenCalled();
    });
  });

  describe('forwardToDepartmentManagers', () => {
    it('routes candidates to their respective department managers', async () => {
      const res = await service.forwardToDepartmentManagers({
        candidateIds: [mockUserId],
        activityId: mockActivityId,
      }, 'admin1');
      expect(res.totalForwarded).toBe(1);
    });
  });

  describe('updateStatus', () => {
    it('manager accepts recommendation and notifies employee', async () => {
      const assignmentWithDetails = {
        ...mockAssignment,
        managerId: { _id: mockManagerId, name: 'Manager' },
        activityId: { _id: mockActivityId, title: 'Test' },
        userId: { _id: mockUserId, name: 'User' },
      };
      mockAssignmentModel.findById.mockReturnValue(chainable(assignmentWithDetails));
      
      const res = await service.updateStatus(mockAssignmentId, 'accepted', mockManagerId);
      expect(res.status).toBe('notified'); // Internal logic moves to notified
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });

    it('throws forbidden if wrong manager', async () => {
      await expect(service.updateStatus(mockAssignmentId, 'accepted', 'wrong-manager')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('employee choice', () => {
    it('employeeAccept creates participation', async () => {
      mockAssignmentModel.findById.mockReturnValue(chainable(mockAssignment));
      await service.employeeAccept(mockAssignmentId, mockUserId);
      expect(mockParticipationsService.create).toHaveBeenCalled();
    });

    it('employeeReject updates status', async () => {
      mockAssignmentModel.findById.mockReturnValue(chainable(mockAssignment));
      const res = await service.employeeReject(mockAssignmentId, mockUserId, 'Busy');
      expect(res.status).toBe('rejected');
    });
  });

  describe('queries', () => {
    it('findAll', async () => {
      await service.findAll();
      expect(mockAssignmentModel.find).toHaveBeenCalled();
    });

    it('findByRecipient', async () => {
      await service.findByRecipient(mockUserId);
      expect(mockAssignmentModel.find).toHaveBeenCalled();
    });
  });
});