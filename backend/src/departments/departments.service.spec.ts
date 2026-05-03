import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DepartmentsService } from './departments.service';
import { Department } from './schema/department.schema';
import { User } from '../users/schema/user.schema';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('DepartmentsService', () => {
  let service: DepartmentsService;

  const mockDeptModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    exec: jest.fn(),
  };

  const mockUserModel = {
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        {
          provide: getModelToken(Department.name),
          useValue: mockDeptModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCode', () => {
    it('should generate a code based on name', () => {
      const code = (service as any).generateCode('Human Resources');
      expect(code).toMatch(/^HR-\d{2}$/);
    });
  });

  describe('create', () => {
    it('should throw ConflictException if department exists', async () => {
      mockDeptModel.findOne.mockResolvedValue({ name: 'IT' });
      await expect(service.create({ name: 'IT' } as any)).rejects.toThrow(ConflictException);
    });

    it('should create a department if it does not exist', async () => {
      mockDeptModel.findOne.mockResolvedValue(null);
      mockDeptModel.create.mockResolvedValue({ name: 'Finance', code: 'FIN-01' });
      
      const result = await service.create({ name: 'Finance' } as any);
      expect(result.name).toBe('Finance');
    });
  });

  describe('remove', () => {
    it('should block deletion when users are assigned', async () => {
      mockUserModel.countDocuments.mockResolvedValue(2);

      await expect(service.remove('dept-1')).rejects.toThrow(BadRequestException);
    });
  });
});
