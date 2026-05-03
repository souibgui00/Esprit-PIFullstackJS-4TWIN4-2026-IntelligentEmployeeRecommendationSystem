import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: jest.Mocked<SettingsService>;

  const mockService = {
    findAll: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [
        {
          provide: SettingsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
    service = module.get(SettingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAll', () => {
    it('returns all settings', async () => {
      service.findAll.mockResolvedValue({ theme: 'dark' });
      const res = await controller.getAll();
      expect(res).toEqual({ theme: 'dark' });
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('returns setting by key', async () => {
      service.get.mockResolvedValue('dark');
      const res = await controller.get('theme');
      expect(res).toBe('dark');
      expect(service.get).toHaveBeenCalledWith('theme');
    });
  });

  describe('set', () => {
    it('sets setting by key and value', async () => {
      service.set.mockResolvedValue({ key: 'theme', value: 'light' } as any);
      const res = await controller.set('theme', 'light');
      expect(res.value).toBe('light');
      expect(service.set).toHaveBeenCalledWith('theme', 'light');
    });
  });
});
