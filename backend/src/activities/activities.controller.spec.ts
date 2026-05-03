import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { AuditService } from '../common/audit/audit.service';

describe('ActivitiesController', () => {
  let controller: ActivitiesController;
  let activitiesService: ActivitiesService;
  let auditService: AuditService;
  const createAsyncMock = () => jest.fn<Promise<any>, any[]>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        {
          provide: ActivitiesService,
          useValue: {
            findPending: createAsyncMock(),
            findAll: createAsyncMock(),
            create: createAsyncMock(),
            update: createAsyncMock(),
            remove: createAsyncMock(),
            findOne: createAsyncMock(),
            findRecommendationEligible: createAsyncMock(),
            extractSkillsFromDescription: createAsyncMock(),
            getRecommendations: createAsyncMock(),
            getRecommendationsForActivity: createAsyncMock(),
            enroll: createAsyncMock(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logAction: createAsyncMock(),
          },
        },
      ],
    }).compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
    activitiesService = module.get<ActivitiesService>(ActivitiesService);
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findPending', () => {
    it('should call activitiesService.findPending and return results', async () => {
      const mockPendingActivities = [
        { _id: '1', title: 'Activity 1', status: 'pending' },
        { _id: '2', title: 'Activity 2', status: 'pending' },
      ];

      (activitiesService.findPending as jest.MockedFunction<
        () => Promise<any[]>
      >).mockResolvedValue(
        mockPendingActivities,
      );

      const result = await controller.findPending();

      expect(activitiesService.findPending).toHaveBeenCalled();
      expect(result).toEqual(mockPendingActivities);
    });

    it('should handle empty pending activities', async () => {
      (activitiesService.findPending as jest.MockedFunction<
        () => Promise<any[]>
      >).mockResolvedValue([]);

      const result = await controller.findPending();

      expect(result).toEqual([]);
      expect(activitiesService.findPending).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all activities without limit', async () => {
      const mockActivities = [
        { _id: '1', title: 'Activity 1' },
        { _id: '2', title: 'Activity 2' },
      ];
      const req = { user: { userId: '123', role: 'ADMIN' } };

      (activitiesService.findAll as jest.MockedFunction<
        () => Promise<any[]>
      >).mockResolvedValue(
        mockActivities,
      );

      const result = await controller.findAll(req);

      expect(activitiesService.findAll).toHaveBeenCalledWith('ADMIN', '123');
      expect(result).toEqual(mockActivities);
    });

    it('should return limited activities when limit is provided', async () => {
      const mockActivities = [
        { _id: '1', title: 'Activity 1' },
        { _id: '2', title: 'Activity 2' },
        { _id: '3', title: 'Activity 3' },
      ];
      const req = { user: { userId: '123', role: 'ADMIN' } };

      (activitiesService.findAll as jest.MockedFunction<
        () => Promise<any[]>
      >).mockResolvedValue(
        mockActivities,
      );

      const result = await controller.findAll(req, '2');

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { _id: '1', title: 'Activity 1' },
        { _id: '2', title: 'Activity 2' },
      ]);
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});
