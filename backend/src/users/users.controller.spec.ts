import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CvExtractionService } from '../common/services/cv-extraction.service';
import { AuditService } from '../common/audit/audit.service';
import { UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addSkillToUser: jest.fn(),
  };

  const mockCvExtractionService = {
    extractCvData: jest.fn(),
  };

  const mockAuditService = {
    logAction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: CvExtractionService,
          useValue: mockCvExtractionService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'Test User 1',
          email: 'test1@example.com',
          role: 'EMPLOYEE',
        },
        {
          id: '2',
          name: 'Test User 2',
          email: 'test2@example.com',
          role: 'MANAGER',
        },
      ];

      jest.spyOn(usersService, 'findAll').mockResolvedValue(mockUsers as any);

      const result = await controller.findAll();

      expect(result).toEqual(mockUsers);
      expect(usersService.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      jest.spyOn(usersService, 'findAll').mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(usersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'EMPLOYEE',
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser as any);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockUser);
      expect(usersService.findOne).toHaveBeenCalledWith('1');
    });

    it('should return null when user not found', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValue(null);

      const result = await controller.findOne('999');

      expect(result).toBeNull();
      expect(usersService.findOne).toHaveBeenCalledWith('999');
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
        telephone: '+1234567890',
      };

      const updatedUser = {
        id: '1',
        name: 'Updated Name',
        email: 'test@example.com',
        telephone: '+1234567890',
        role: 'EMPLOYEE',
      };

      jest.spyOn(usersService, 'update').mockResolvedValue(updatedUser as any);

      const mockRequest = { user: { userId: 'admin' } } as any;
      const result = await controller.update(mockRequest, '1', updateUserDto);

      expect(result).toEqual(updatedUser);
      expect(usersService.update).toHaveBeenCalledWith('1', updateUserDto);
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      jest.spyOn(usersService, 'update').mockRejectedValue(
        new NotFoundException('User not found')
      );

      const mockRequest = { user: { userId: 'admin' } } as any;
      await expect(controller.update(mockRequest, '999', updateUserDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      const mockUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
      };

      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(usersService, 'remove').mockResolvedValue(mockUser as any);

      const mockRequest = { user: { userId: 'admin' } } as any;
      const response = await controller.remove(mockRequest, '1');

      expect(response).toEqual(mockUser);
      expect(usersService.remove).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when deleting non-existent user', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValue(null);
      jest.spyOn(usersService, 'remove').mockRejectedValue(
        new Error('User not found')
      );

      const mockRequest = { user: { userId: 'admin' } } as any;
      await expect(controller.remove(mockRequest, '999')).rejects.toThrow(
        'User not found'
      );
    });
  });
});
