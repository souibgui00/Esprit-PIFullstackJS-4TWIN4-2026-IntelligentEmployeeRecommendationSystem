import { Test, TestingModule } from '@nestjs/testing';
import { ParticipationsController } from './participations.controller';
import { ParticipationsService } from './participations.service';

describe('ParticipationsController', () => {
  let controller: ParticipationsController;
  let service: jest.Mocked<ParticipationsService>;

  const mockService = {
    findAll: jest.fn(),
    findByUser: jest.fn(),
    getOrganizerPanel: jest.fn(),
    create: jest.fn(),
    updateProgress: jest.fn(),
    remove: jest.fn(),
    markCompleteByEmployee: jest.fn(),
    getPendingManagerValidations: jest.fn(),
    submitOrganizerReport: jest.fn(),
    getValidationReportData: jest.fn(),
    submitManagerValidation: jest.fn(),
  };

  const mockReq = { user: { userId: 'user-123' } };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParticipationsController],
      providers: [
        {
          provide: ParticipationsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ParticipationsController>(ParticipationsController);
    service = module.get(ParticipationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllParticipations', () => {
    it('should call findAll', async () => {
      service.findAll.mockResolvedValue([]);
      const res = await controller.getAllParticipations();
      expect(res).toEqual([]);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('getMyParticipations', () => {
    it('should return current user participations', async () => {
      service.findByUser.mockResolvedValue([]);
      const res = await controller.getMyParticipations(mockReq);
      expect(res).toEqual([]);
      expect(service.findByUser).toHaveBeenCalledWith('user-123');
    });
  });

  describe('getUserParticipations', () => {
    it('should return specified user participations', async () => {
      service.findByUser.mockResolvedValue([]);
      await controller.getUserParticipations('other-123');
      expect(service.findByUser).toHaveBeenCalledWith('other-123');
    });
  });

  describe('getOrganizerPanel', () => {
    it('should get panel for activity', async () => {
      service.getOrganizerPanel.mockResolvedValue({} as any);
      await controller.getOrganizerPanel('act-1');
      expect(service.getOrganizerPanel).toHaveBeenCalledWith('act-1');
    });
  });

  describe('enroll', () => {
    it('enrolls current user if no body.userId provided', async () => {
      service.create.mockResolvedValue({} as any);
      await controller.enroll(mockReq, 'act-1');
      expect(service.create).toHaveBeenCalledWith('user-123', 'act-1');
    });

    it('enrolls specified user if body.userId provided', async () => {
      service.create.mockResolvedValue({} as any);
      await controller.enroll(mockReq, 'act-1', 'target-123');
      expect(service.create).toHaveBeenCalledWith('target-123', 'act-1');
    });
  });

  describe('updateProgress', () => {
    it('updates progress', async () => {
      service.updateProgress.mockResolvedValue({} as any);
      await controller.updateProgress(mockReq, 'act-1', 50, 4);
      expect(service.updateProgress).toHaveBeenCalledWith('user-123', 'act-1', 50, 4);
    });
  });

  describe('unenroll', () => {
    it('unenrolls target user', async () => {
      service.remove.mockResolvedValue({} as any);
      await controller.unenroll(mockReq, 'act-1', 'target-1');
      expect(service.remove).toHaveBeenCalledWith('target-1', 'act-1');
    });
    
    it('unenrolls self', async () => {
      service.remove.mockResolvedValue({} as any);
      await controller.unenroll(mockReq, 'act-1');
      expect(service.remove).toHaveBeenCalledWith('user-123', 'act-1');
    });
  });

  describe('markCompleteByEmployee', () => {
    it('marks completion via PATCH', async () => {
      service.markCompleteByEmployee.mockResolvedValue({} as any);
      await controller.markCompleteByEmployee(mockReq, 'part-1');
      expect(service.markCompleteByEmployee).toHaveBeenCalledWith('part-1', 'user-123');
    });

    it('marks completion via GET', async () => {
      service.markCompleteByEmployee.mockResolvedValue({} as any);
      await controller.markCompleteByEmployeeGet(mockReq, 'part-1');
      expect(service.markCompleteByEmployee).toHaveBeenCalledWith('part-1', 'user-123');
    });
  });

  describe('manager validations', () => {
    it('gets pending validations', async () => {
      service.getPendingManagerValidations.mockResolvedValue([]);
      await controller.getPendingValidations(mockReq);
      expect(service.getPendingManagerValidations).toHaveBeenCalledWith('user-123');
    });

    it('submits organizer report', async () => {
      service.submitOrganizerReport.mockResolvedValue({} as any);
      await controller.submitOrganizerReport('act-1', []);
      expect(service.submitOrganizerReport).toHaveBeenCalledWith('act-1', []);
    });

    it('gets validation report data', async () => {
      service.getValidationReportData.mockResolvedValue({} as any);
      await controller.getValidationReportData('part-1');
      expect(service.getValidationReportData).toHaveBeenCalledWith('part-1');
    });

    it('submits manager validation', async () => {
      service.submitManagerValidation.mockResolvedValue({} as any);
      await controller.submitManagerValidation(mockReq, 'part-1', true, 5, 'Good', { 'skill-1': true });
      expect(service.submitManagerValidation).toHaveBeenCalledWith(
        'part-1',
        'user-123',
        true,
        5,
        'Good',
        { 'skill-1': true }
      );
    });
    
    it('submits manager validation with default empty skills', async () => {
      service.submitManagerValidation.mockResolvedValue({} as any);
      await controller.submitManagerValidation(mockReq, 'part-1', true, 5, 'Good', undefined as any);
      expect(service.submitManagerValidation).toHaveBeenCalledWith(
        'part-1',
        'user-123',
        true,
        5,
        'Good',
        {}
      );
    });
  });
});
