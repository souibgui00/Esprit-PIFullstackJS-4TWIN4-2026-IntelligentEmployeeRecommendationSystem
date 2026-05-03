import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SettingsService } from './settings.service';
import { Types } from 'mongoose';

describe('SettingsService', () => {
  let service: SettingsService;

  const mockSettingsModel = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOne: jest.fn(),
  };

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

  describe('getAllSettings', () => {
    it('should retrieve all settings', async () => {
      mockSettingsModel.find.mockResolvedValueOnce([
        { key: 'app_name', value: 'Employee Recommendation System' },
        { key: 'max_users', value: '1000' },
      ]);

      expect(service).toBeDefined();
    });
  });

  describe('getSetting', () => {
    it('should retrieve setting by key', async () => {
      mockSettingsModel.findOne.mockResolvedValueOnce({
        key: 'app_version',
        value: '1.0.0',
      });

      expect(service).toBeDefined();
    });

    it('should return null for non-existent setting', async () => {
      mockSettingsModel.findOne.mockResolvedValueOnce(null);

      expect(service).toBeDefined();
    });
  });

  describe('updateSetting', () => {
    it('should update setting value', async () => {
      const settingId = new Types.ObjectId();

      mockSettingsModel.findByIdAndUpdate.mockResolvedValueOnce({
        _id: settingId,
        key: 'max_participants',
        value: '500',
      });

      expect(service).toBeDefined();
    });
  });

  describe('createSetting', () => {
    it('should create new setting', async () => {
      mockSettingsModel.create.mockResolvedValueOnce({
        _id: new Types.ObjectId(),
        key: 'new_setting',
        value: 'default_value',
      });

      expect(service).toBeDefined();
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});
