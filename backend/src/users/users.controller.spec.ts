import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CvExtractionService } from '../common/services/cv-extraction.service';
import { AuditService } from '../common/audit/audit.service';
import { Request } from 'express';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;
  let cvExtractionService: jest.Mocked<CvExtractionService>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    const mockUsersService = {
      update: jest.fn(),
      findOne: jest.fn(),
      addSkillToUser: jest.fn(),
      changePassword: jest.fn(),
      updateUserSkill: jest.fn(),
      create: jest.fn(),
      findAllLightweight: jest.fn(),
      findAll: jest.fn(),
      calculateAllEmployeesWeightedSkillScores: jest.fn(),
      calculateEmployeeWeightedSkillScore: jest.fn(),
      remove: jest.fn(),
      updateRole: jest.fn(),
      recomputeUserSkillScores: jest.fn(),
      recomputeAllUsersSkillScores: jest.fn(),
      healSkillObjectIds: jest.fn(),
      removeSkillFromUser: jest.fn(),
      calculateSkillScore: jest.fn(),
      calculateGlobalActivityScore: jest.fn(),
      getCombinedScore: jest.fn(),
    };

    const mockCvExtractionService = {
      extractDataFromCV: jest.fn(),
      extractProfileFromBuffer: jest.fn(),
    };

    const mockAuditService = {
      logAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: CvExtractionService, useValue: mockCvExtractionService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
    cvExtractionService = module.get(CvExtractionService);
    auditService = module.get(AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadAvatar', () => {
    it('should upload avatar and update user', async () => {
      const mockReq = { user: { userId: '1' } } as unknown as Request;
      const mockFile = { filename: 'test.png' };
      usersService.update.mockResolvedValue({ id: '1', avatar: 'url' } as any);

      const result = await controller.uploadAvatar(mockReq, mockFile);
      expect(usersService.update).toHaveBeenCalledWith('1', expect.objectContaining({ avatar: expect.stringContaining('test.png') }));
      expect(result).toBeDefined();
    });
  });

  describe('uploadMyCv', () => {
    it('should upload cv, extract skills and update user', async () => {
      const mockReq = { user: { userId: '1' } } as unknown as Request;
      const mockFile = { filename: 'test.pdf', path: '/path/test.pdf', originalname: 'test.pdf' };
      
      usersService.update.mockResolvedValue({} as any);
      cvExtractionService.extractDataFromCV.mockResolvedValue(['skill1', 'skill2']);
      usersService.findOne.mockResolvedValue({ yearsOfExperience: 5, skills: [] } as any);
      usersService.addSkillToUser.mockResolvedValue({} as any);

      const result = await controller.uploadMyCv(mockReq, mockFile);
      expect(cvExtractionService.extractDataFromCV).toHaveBeenCalled();
      expect(usersService.addSkillToUser).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('message');
    });
  });

  describe('getMe', () => {
    it('should return current user', async () => {
      const mockReq = { user: { userId: '1' } } as unknown as Request;
      usersService.findOne.mockResolvedValue({ id: '1', name: 'Test' } as any);
      
      const result = await controller.getMe(mockReq);
      expect(usersService.findOne).toHaveBeenCalledWith('1');
      expect(result.name).toBe('Test');
    });
  });

  describe('CRUD operations', () => {
    it('should create user', async () => {
      const mockReq = { user: { userId: 'admin1' } } as unknown as Request;
      const dto = { email: 'test@test.com', password: '123' } as any;
      usersService.create.mockResolvedValue({ _id: '1', email: 'test@test.com' } as any);
      
      const result = await controller.create(mockReq, dto);
      expect(usersService.create).toHaveBeenCalledWith(dto);
      expect(auditService.logAction).toHaveBeenCalled();
      expect(result?._id).toBe('1');
    });

    it('should find all lightweight', async () => {
      usersService.findAllLightweight.mockResolvedValue([]);
      await controller.findAll(undefined, 'true');
      expect(usersService.findAllLightweight).toHaveBeenCalled();
    });

    it('should update user', async () => {
      const mockReq = { user: { userId: 'admin1' } } as unknown as Request;
      usersService.findOne.mockResolvedValue({ _id: '1' } as any);
      usersService.update.mockResolvedValue({ _id: '1', name: 'Updated' } as any);
      
      const result = await controller.update(mockReq, '1', { name: 'Updated' } as any);
      expect(usersService.update).toHaveBeenCalledWith('1', { name: 'Updated' });
      expect(auditService.logAction).toHaveBeenCalled();
    });

    it('should remove user', async () => {
      const mockReq = { user: { userId: 'admin1' } } as unknown as Request;
      usersService.findOne.mockResolvedValue({ _id: '1' } as any);
      usersService.remove.mockResolvedValue({ deleted: true } as any);
      
      await controller.remove(mockReq, '1');
      expect(usersService.remove).toHaveBeenCalledWith('1');
      expect(auditService.logAction).toHaveBeenCalled();
    });
  });

  describe('Skill endpoints', () => {
    it('should add skill to user', async () => {
      usersService.addSkillToUser.mockResolvedValue({} as any);
      await controller.addSkill('1', { skillId: 's1' });
      expect(usersService.addSkillToUser).toHaveBeenCalledWith('1', { skillId: 's1' });
    });

    it('should calculate global activity score', async () => {
      usersService.calculateGlobalActivityScore.mockResolvedValue(0.5);
      const res = await controller.getGlobalActivityScore('1');
      expect(res).toBe(0.5);
    });
  });
});
