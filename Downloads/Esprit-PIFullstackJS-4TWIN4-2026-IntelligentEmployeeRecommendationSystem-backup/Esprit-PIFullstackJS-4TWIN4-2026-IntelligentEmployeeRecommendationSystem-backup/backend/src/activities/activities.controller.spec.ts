import { Test, TestingModule } from '@nestjs/testing';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { AuditService } from '../common/audit/audit.service';

describe('ActivitiesController', () => {
  let controller: ActivitiesController;
  let service: jest.Mocked<ActivitiesService>;
  let audit: jest.Mocked<AuditService>;

  const mockActivitiesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findPending: jest.fn(),
    findRecommendationEligible: jest.fn(),
    extractSkillsFromDescription: jest.fn(),
    getRecommendations: jest.fn(),
    getRecommendationsForActivity: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    enroll: jest.fn(),
    unenroll: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
  };

  const mockAuditService = {
    logAction: jest.fn().mockResolvedValue({}),
  };

  const mockReq = { user: { userId: 'user-1', role: 'admin' } };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivitiesController],
      providers: [
        { provide: ActivitiesService, useValue: mockActivitiesService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    controller = module.get<ActivitiesController>(ActivitiesController);
    service = module.get(ActivitiesService);
    audit = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('calls service and logs action', async () => {
      service.create.mockResolvedValue({ _id: 'act1' } as any);
      const res = await controller.create({ title: 'New' } as any, mockReq);
      expect(res).toBeDefined();
      expect(audit.logAction).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('calls service with role and userId', async () => {
      service.findAll.mockResolvedValue([]);
      await controller.findAll(mockReq);
      expect(service.findAll).toHaveBeenCalledWith('admin', 'user-1');
    });

    it('handles limit query', async () => {
      service.findAll.mockResolvedValue([{ id: 1 }, { id: 2 }] as any);
      const res = await controller.findAll(mockReq, '1');
      expect(res).toHaveLength(1);
    });
  });

  describe('workflow actions', () => {
    it('approves and logs', async () => {
      service.approve.mockResolvedValue({} as any);
      await controller.approve('act1', mockReq);
      expect(service.approve).toHaveBeenCalled();
      expect(audit.logAction).toHaveBeenCalled();
    });

    it('rejects and logs', async () => {
      service.reject.mockResolvedValue({} as any);
      await controller.reject('act1', mockReq, 'Reason');
      expect(service.reject).toHaveBeenCalled();
      expect(audit.logAction).toHaveBeenCalled();
    });

    it('enrolls', async () => {
      await controller.enroll('act1');
      expect(service.enroll).toHaveBeenCalledWith('act1');
    });

    it('unenrolls', async () => {
      await controller.unenroll('act1');
      expect(service.unenroll).toHaveBeenCalledWith('act1');
    });
  });

  describe('recommendations', () => {
    it('getRecommendations for user', async () => {
      await controller.getRecommendations('u1');
      expect(service.getRecommendations).toHaveBeenCalledWith('u1');
    });

    it('getRecommendationsForActivity', async () => {
      await controller.getRecommendationsForActivity('act1', 'some prompt');
      expect(service.getRecommendationsForActivity).toHaveBeenCalledWith('act1', 'some prompt');
    });
  });

  describe('CRUD', () => {
    it('findOne', async () => {
      await controller.findOne('act1');
      expect(service.findOne).toHaveBeenCalledWith('act1');
    });

    it('update and log', async () => {
      service.update.mockResolvedValue({} as any);
      await controller.update('act1', { title: 'U' } as any, mockReq);
      expect(audit.logAction).toHaveBeenCalled();
    });

    it('remove and log', async () => {
      service.remove.mockResolvedValue({} as any);
      await controller.remove('act1', mockReq);
      expect(audit.logAction).toHaveBeenCalled();
    });
  });
});
