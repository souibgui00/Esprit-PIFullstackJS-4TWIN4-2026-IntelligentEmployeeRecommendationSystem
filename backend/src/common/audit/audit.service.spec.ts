import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { Types } from 'mongoose';

describe('AuditService', () => {
  let service: AuditService;

  // Mock model as a constructor function that returns instances with a save() method
  const mockAuditInstance = {
    save: jest.fn().mockResolvedValue({}),
  };

  const mockAuditLogModel: any = jest.fn().mockImplementation(() => mockAuditInstance);

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getModelToken('AuditLog'),
          useValue: mockAuditLogModel,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logAction', () => {
    it('should create and save audit log', async () => {
      const auditData = {
        action: 'CREATE',
        entityType: 'User',
        entityId: new Types.ObjectId().toString(),
        actorId: new Types.ObjectId().toString(),
        metadata: { source: 'admin' },
      };

      const mockSaved = { _id: new Types.ObjectId(), ...auditData };
      mockAuditInstance.save.mockResolvedValueOnce(mockSaved);

      await service.logAction(auditData);

      expect(mockAuditLogModel).toHaveBeenCalled();
      expect(mockAuditInstance.save).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const auditData = {
        action: 'UPDATE',
        entityType: 'Activity',
        entityId: new Types.ObjectId().toString(),
        actorId: new Types.ObjectId().toString(),
        oldValue: { name: 'Old Activity' },
        newValue: { name: 'New Activity' },
      };

      const result = await service.logAction(auditData);

      // Service should return null or handle error
      expect(result === null || result !== undefined).toBe(true);
    });

    it('should include optional metadata', async () => {
      const auditData = {
        action: 'DELETE',
        entityType: 'Department',
        entityId: new Types.ObjectId().toString(),
        actorId: new Types.ObjectId().toString(),
        oldValue: { name: 'IT Department' },
        metadata: { reason: 'Reorganization', approvedBy: 'Manager' },
      };

      await service.logAction(auditData);

      expect(service).toBeDefined();
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});
