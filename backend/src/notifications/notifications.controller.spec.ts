import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;

  const mockService = {
    create: jest.fn(),
    findByRecipient: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    remove: jest.fn(),
  };

  const mockReq = { user: { userId: 'user-1' } };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('creates notification', async () => {
      service.create.mockResolvedValue({} as any);
      await controller.create({ title: 'Test' } as any);
      expect(service.create).toHaveBeenCalledWith({ title: 'Test' });
    });
  });

  describe('findAll', () => {
    it('finds by recipient', async () => {
      service.findByRecipient.mockResolvedValue([]);
      await controller.findAll(mockReq);
      expect(service.findByRecipient).toHaveBeenCalledWith('user-1');
    });
  });

  describe('markAsRead', () => {
    it('marks read', async () => {
      service.markAsRead.mockResolvedValue({} as any);
      await controller.markAsRead('123');
      expect(service.markAsRead).toHaveBeenCalledWith('123');
    });
  });

  describe('markAllAsRead', () => {
    it('marks all read', async () => {
      service.markAllAsRead.mockResolvedValue({} as any);
      await controller.markAllAsRead(mockReq);
      expect(service.markAllAsRead).toHaveBeenCalledWith('user-1');
    });
  });

  describe('remove', () => {
    it('removes notification', async () => {
      service.remove.mockResolvedValue({} as any);
      await controller.remove('123');
      expect(service.remove).toHaveBeenCalledWith('123');
    });
  });
});
