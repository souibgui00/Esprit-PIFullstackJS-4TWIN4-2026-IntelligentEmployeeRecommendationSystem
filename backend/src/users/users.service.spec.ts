import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { EmailService } from '../common/services/email.service';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
jest.mock('bcrypt', () => ({ compare: jest.fn(), hash: jest.fn(), genSalt: jest.fn().mockResolvedValue('salt') }));

describe('UsersService', () => {
  let service: UsersService;

  const mockUserId = new Types.ObjectId().toHexString();
  const mockSkillId = new Types.ObjectId().toHexString();

  const mockUser = {
    _id: mockUserId,
    name: 'John Doe',
    email: 'john@example.com',
    password: '$2b$10$hashedpassword',
    matricule: 'EMP-2024-001',
    role: 'EMPLOYEE',
    yearsOfExperience: 5,
    skills: [
      {
        skillId: mockSkillId,
        level: 3,
        score: 85,
        auto_eval: 4,
        hierarchie_eval: 5,
        lastUpdated: new Date(),
      },
    ],
    rankScore: 80,
  } as any;

  const mockUserModel: any = {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    deleteOne: jest.fn(),
  };

  const mockEmailService = {
    sendNewUserCredentials: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  function chainable(result: any) {
    return {
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue(result),
      exec: jest.fn().mockResolvedValue(result),
      then: jest.fn().mockImplementation((onFulfilled: any) => Promise.resolve(onFulfilled ? onFulfilled(result) : result)),
      catch: jest.fn().mockImplementation((onRejected: any) => Promise.resolve()),
    };
  }

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have basic methods', () => {
    expect(typeof service.create).toBe('function');
    expect(typeof service.findOne).toBe('function');
    expect(typeof service.findByEmail).toBe('function');
    expect(typeof service.updateRole).toBe('function');
    expect(typeof service.changePassword).toBe('function');
    expect(typeof service.calculateEmployeeWeightedSkillScore).toBe('function');
    expect(typeof service.invalidateUsersCache).toBe('function');
  });

  describe('findOne', () => {
    it('returns user when found', async () => {
      mockUserModel.findById.mockReturnValue(chainable(mockUser));
      const res = await service.findOne(mockUserId);
      expect(res).toEqual(mockUser);
    });

    it('throws NotFoundException when not found', async () => {
      mockUserModel.findById.mockReturnValue(chainable(null));
      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('returns user by email', async () => {
      mockUserModel.findOne.mockReturnValue(chainable(mockUser));
      const res = await service.findByEmail(mockUser.email);
      expect(res).toEqual(mockUser);
    });

    it('returns null when not found', async () => {
      mockUserModel.findOne.mockReturnValue(chainable(null));
      const res = await service.findByEmail('none@example.com');
      expect(res).toBeNull();
    });
  });

  describe('updateRole', () => {
    it('updates role when user exists', async () => {
      const updated = { ...mockUser, role: 'MANAGER' };
      mockUserModel.findByIdAndUpdate.mockReturnValue(chainable(updated));
      const res = await service.updateRole(mockUserId, 'MANAGER' as any);
      expect(res.role).toBe('MANAGER');
    });

    it('throws NotFoundException when user missing', async () => {
      mockUserModel.findByIdAndUpdate.mockReturnValue(chainable(null));
      await expect(service.updateRole('nope', 'MANAGER' as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    it('changes password when current is correct', async () => {
      (bcrypt.compare as unknown as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('newhash');
      const userDoc = { ...mockUser, save: jest.fn().mockResolvedValue(true) } as any;
      mockUserModel.findById.mockReturnValue(chainable(userDoc));
      mockUserModel.findByIdAndUpdate.mockReturnValue(chainable({ ...mockUser, password: 'newhash' }));

      const res = await service.changePassword(mockUserId, 'old', 'newpassword123');
      expect(res).toBeDefined();
    });

    it('throws UnauthorizedException when current is incorrect', async () => {
      (bcrypt.compare as unknown as jest.Mock).mockResolvedValue(false);
      mockUserModel.findById.mockReturnValue(chainable(mockUser));
      await expect(service.changePassword(mockUserId, 'bad', 'newpass')).rejects.toThrow(UnauthorizedException);
    });

    it('throws BadRequestException when new password too short', async () => {
      (bcrypt.compare as unknown as jest.Mock).mockResolvedValue(true);
      mockUserModel.findById.mockReturnValue(chainable(mockUser));
      await expect(service.changePassword(mockUserId, 'old', 'short')).rejects.toThrow(BadRequestException);
    });
  });

  describe('calculateEmployeeWeightedSkillScore', () => {
    it('returns a number when user found', async () => {
      mockUserModel.findById.mockReturnValue(chainable(mockUser));
      const score = await service.calculateEmployeeWeightedSkillScore(mockUserId);
      expect(score).toBeDefined();
      expect(score).toHaveProperty('weightedScore');
    });

    it('throws NotFoundException when user missing', async () => {
      mockUserModel.findById.mockReturnValue(chainable(null));
      await expect(service.calculateEmployeeWeightedSkillScore('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('invalidateUsersCache', () => {
    it('runs without error', () => {
      expect(() => service.invalidateUsersCache()).not.toThrow();
    });
  });
});
