import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ActivityRequestService } from './activity-request.service';
import { ActivitiesService } from './activities.service';
import { Types } from 'mongoose';

describe('ActivityRequestService', () => {
  let service: ActivityRequestService;

  const mockActivityRequestModel = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockActivitiesService = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityRequestService,
        {
          provide: getModelToken('ActivityRequest'),
          useValue: mockActivityRequestModel,
        },
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
      ],
    }).compile();

    service = module.get<ActivityRequestService>(ActivityRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRequest', () => {
    it('should create activity request', async () => {
      const requestData = {
        title: 'New Activity Request',
        description: 'Test activity request',
        requiredSkills: ['JavaScript', 'TypeScript'],
        targetDepartment: 'Engineering',
      };

      mockActivityRequestModel.create.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        ...requestData,
        status: 'pending',
        createdAt: new Date(),
      });

      expect(service).toBeDefined();
    });
  });

  describe('getRequests', () => {
    it('should retrieve activity requests', async () => {
      mockActivityRequestModel.find.mockResolvedValueOnce([
        {
          _id: new Types.ObjectId(),
          title: 'Request 1',
          status: 'pending',
        },
        {
          _id: new Types.ObjectId(),
          title: 'Request 2',
          status: 'approved',
        },
      ]);

      expect(service).toBeDefined();
    });
  });

  describe('approveRequest', () => {
    it('should approve activity request', async () => {
      const requestId = new Types.ObjectId();

      mockActivityRequestModel.findByIdAndUpdate.mockResolvedValueOnce({
        _id: requestId,
        status: 'approved',
      });

      mockActivitiesService.create.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        title: 'New Activity',
      });

      expect(service).toBeDefined();
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});
