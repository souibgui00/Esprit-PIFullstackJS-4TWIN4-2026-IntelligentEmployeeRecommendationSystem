import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  const mockSettingsModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  function chainable(result: any) {
    return {
      exec: jest.fn().mockResolvedValue(result),
    };
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: getModelToken('Setting'),
          useValue: mockSettingsModel,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns all settings as a key-value map', async () => {
      mockSettingsModel.find.mockReturnValue(chainable([
        { key: 'theme', value: 'dark' },
        { key: 'notifications', value: true }
      ]));
      const res = await service.findAll();
      expect(res).toEqual({ theme: 'dark', notifications: true });
    });
  });

  describe('get', () => {
    it('returns setting value if exists', async () => {
      mockSettingsModel.findOne.mockReturnValue(chainable({ key: 'theme', value: 'dark' }));
      const res = await service.get('theme');
      expect(res).toBe('dark');
    });

    it('returns null if setting does not exist', async () => {
      mockSettingsModel.findOne.mockReturnValue(chainable(null));
      const res = await service.get('nonexistent');
      expect(res).toBeNull();
    });
  });

  describe('set', () => {
    it('creates or updates a setting', async () => {
      mockSettingsModel.findOneAndUpdate.mockReturnValue(chainable({ key: 'theme', value: 'light' }));
      const res = await service.set('theme', 'light');
      expect(res.value).toBe('light');
      expect(mockSettingsModel.findOneAndUpdate).toHaveBeenCalledWith(
        { key: 'theme' },
        { value: 'light' },
        expect.any(Object)
      );
    });
  });
});
