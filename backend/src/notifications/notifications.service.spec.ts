import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { Types } from 'mongoose';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockSave = jest.fn();
  function MockNotificationModel(data: any) {
    this.save = mockSave;
  }
  
  MockNotificationModel.find = jest.fn();
  MockNotificationModel.findByIdAndUpdate = jest.fn();
  MockNotificationModel.updateMany = jest.fn();
  MockNotificationModel.findByIdAndDelete = jest.fn();

  function chainable(result: any) {
    return {
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(result),
    };
  }

  const mockGateway = {
    emitToUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken('Notification'),
          useValue: MockNotificationModel,
        },
        {
          provide: NotificationsGateway,
          useValue: mockGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates notification and emits', async () => {
      mockSave.mockResolvedValueOnce({ recipientId: 'user-1' });
      await service.create({ recipientId: 'user-1', title: 'Test', message: 'Hello', type: 'info' } as any);
      expect(mockSave).toHaveBeenCalled();
      expect(mockGateway.emitToUser).toHaveBeenCalledWith('user-1', 'newNotification', { recipientId: 'user-1' });
    });

    it('handles emit error gracefully', async () => {
      mockSave.mockResolvedValueOnce({ recipientId: 'user-1' });
      mockGateway.emitToUser.mockImplementationOnce(() => { throw new Error('Gateway Error'); });
      const res = await service.create({ recipientId: 'user-1', title: 'Test', message: 'Hello', type: 'info' } as any);
      expect(res.recipientId).toBe('user-1'); // still returns created document
    });

    it('does not emit if emitRealtime is false', async () => {
      mockSave.mockResolvedValueOnce({ recipientId: 'user-1' });
      await service.create({ recipientId: 'user-1', title: 'Test', message: 'Hello', type: 'info' } as any, { emitRealtime: false });
      expect(mockGateway.emitToUser).not.toHaveBeenCalled();
    });
  });

  describe('findByRecipient', () => {
    it('finds by recipient', async () => {
      MockNotificationModel.find.mockReturnValue(chainable([{ title: 'Test' }]));
      const res = await service.findByRecipient('user-1');
      expect(res).toHaveLength(1);
    });
  });

  describe('markAsRead', () => {
    it('marks read', async () => {
      MockNotificationModel.findByIdAndUpdate.mockReturnValue(chainable({ read: true }));
      await service.markAsRead('id-1');
      expect(MockNotificationModel.findByIdAndUpdate).toHaveBeenCalledWith('id-1', { read: true }, { new: true });
    });
  });

  describe('markAllAsRead', () => {
    it('marks all read for user', async () => {
      MockNotificationModel.updateMany.mockReturnValue(chainable({ modifiedCount: 2 }));
      await service.markAllAsRead('user-1');
      expect(MockNotificationModel.updateMany).toHaveBeenCalledWith({ recipientId: 'user-1', read: false }, { read: true });
    });
  });

  describe('remove', () => {
    it('removes notification', async () => {
      MockNotificationModel.findByIdAndDelete.mockReturnValue(chainable({}));
      await service.remove('id-1');
      expect(MockNotificationModel.findByIdAndDelete).toHaveBeenCalledWith('id-1');
    });
  });
});
