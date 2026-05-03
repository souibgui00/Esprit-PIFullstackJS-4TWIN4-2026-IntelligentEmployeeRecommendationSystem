import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { Types } from 'mongoose';

describe('AuditService', () => {
  let service: AuditService;

  const mockSave = jest.fn();

  function MockAuditModel(data: any) {
    this.save = mockSave;
  }
  
  MockAuditModel.find = jest.fn();

  function chainable(result: any) {
    return {
      sort: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(result),
    };
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getModelToken('AuditLog'),
          useValue: MockAuditModel,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logAction', () => {
    it('should save a new audit log', async () => {
      mockSave.mockResolvedValueOnce({ _id: '123' });
      const res = await service.logAction({
        action: 'TEST',
        entityType: 'User',
        entityId: 'user-1',
        actorId: new Types.ObjectId().toString(),
      });
      expect(res).toBeDefined();
      expect(mockSave).toHaveBeenCalled();
    });

    it('should return null on error', async () => {
      mockSave.mockRejectedValueOnce(new Error('DB Error'));
      const res = await service.logAction({
        action: 'TEST',
        entityType: 'User',
        entityId: 'user-1',
        actorId: new Types.ObjectId().toString(),
      });
      expect(res).toBeNull();
    });
  });

  describe('findByEntity', () => {
    it('returns logs by entity', async () => {
      MockAuditModel.find.mockReturnValue(chainable([]));
      const res = await service.findByEntity('User', 'user-1');
      expect(res).toEqual([]);
      expect(MockAuditModel.find).toHaveBeenCalledWith({ entityType: 'User', entityId: 'user-1' });
    });
  });

  describe('findByActor', () => {
    it('returns logs by actor', async () => {
      MockAuditModel.find.mockReturnValue(chainable([]));
      const res = await service.findByActor('actor-1');
      expect(res).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('returns all populated logs', async () => {
      MockAuditModel.find.mockReturnValue(chainable([{ _id: '1' }]));
      const res = await service.findAll();
      expect(res).toHaveLength(1);
    });
  });
});
