import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { Types } from 'mongoose';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockNotificationModel = function(data: any) {
    return {
      ...data,
      save: jest.fn().mockResolvedValue(data),
    };
  };

  mockNotificationModel.find = jest.fn();
  mockNotificationModel.findById = jest.fn();
  mockNotificationModel.findByIdAndUpdate = jest.fn();
  mockNotificationModel.updateMany = jest.fn();
  mockNotificationModel.findByIdAndDelete = jest.fn();

  const mockNotificationsGateway = {
    emitToUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken('Notification'),
          useValue: mockNotificationModel,
        },
        {
          provide: NotificationsGateway,
          useValue: mockNotificationsGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByRecipient', () => {
    it('should return notifications for a recipient', async () => {
      const recipientId = new Types.ObjectId().toHexString();
      const mockNotifications = [{ recipientId, title: 'Test' }];
      
      mockNotificationModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockNotifications),
      });

      const result = await service.findByRecipient(recipientId);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test');
    });
  });

  describe('markAsRead', () => {
    it('should update notification status to read', async () => {
      const id = new Types.ObjectId().toHexString();
      mockNotificationModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: id, read: true }),
      });

      const result = await service.markAsRead(id);
      expect(result).toBeDefined();
      expect(result?.read).toBe(true);
    });
  });
});
