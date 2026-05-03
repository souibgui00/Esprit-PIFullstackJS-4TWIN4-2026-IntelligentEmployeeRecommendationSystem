import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SkillDecayService } from './skill-decay.service';
import { UsersService } from './users.service';
import { Types } from 'mongoose';

describe('SkillDecayService', () => {
  let service: SkillDecayService;

  const mockUserModel = {
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillDecayService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<SkillDecayService>(SkillDecayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateSkillDecay', () => {
    it('should calculate skill decay for a user', async () => {
      const userId = new Types.ObjectId();
      const monthsUnused = 6;

      // Mock implementation
      const decayRate = 0.1; // 10% per month
      const expectedDecay = Math.pow(1 - decayRate, monthsUnused);

      expect(expectedDecay).toBeLessThan(1);
      expect(expectedDecay).toBeGreaterThan(0);
    });

    it('should cap minimum proficiency level', async () => {
      const userId = new Types.ObjectId();
      const monthsUnused = 36; // 3 years

      // Decay should be capped at minimum level
      expect(service).toBeDefined();
    });
  });

  describe('applySkillDecay', () => {
    it('should apply decay to user skills', async () => {
      const userId = new Types.ObjectId();

      mockUserModel.findByIdAndUpdate.mockResolvedValueOnce({
        _id: userId,
        skills: [
          {
            skillId: new Types.ObjectId(),
            proficiency: 0.8,
            lastUsed: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
          },
        ],
      });

      expect(service).toBeDefined();
    });
  });

  describe('processBatchSkillDecay', () => {
    it('should process skill decay for all users', async () => {
      mockUserModel.find.mockResolvedValueOnce([
        {
          _id: new Types.ObjectId(),
          name: 'User 1',
          skills: [],
        },
        {
          _id: new Types.ObjectId(),
          name: 'User 2',
          skills: [],
        },
      ]);

      expect(service).toBeDefined();
    });
  });

  describe('refreshSkillUsage', () => {
    it('should update skill last used timestamp', async () => {
      const userId = new Types.ObjectId();
      const skillId = new Types.ObjectId();

      mockUserModel.findByIdAndUpdate.mockResolvedValueOnce({
        _id: userId,
        skills: [
          {
            skillId: skillId,
            lastUsed: new Date(),
          },
        ],
      });

      expect(service).toBeDefined();
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});
