import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DepartmentsService } from './departments.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('DepartmentsService', () => {
  let service: DepartmentsService;

  const mockDept = {
    _id: 'dept1',
    name: 'Engineering',
    code: 'ENG',
    manager_id: 'm1',
  };

  function chainable(result: any) {
    const p = Promise.resolve(result) as any;
    p.populate = jest.fn().mockReturnValue(p);
    p.sort = jest.fn().mockReturnValue(p);
    p.exec = jest.fn().mockResolvedValue(result);
    return p;
  }

  const mockDeptModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
  };

  const mockUserModel = {
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        { provide: getModelToken('Department'), useValue: mockDeptModel },
        { provide: getModelToken('User'), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a department with generated code', async () => {
      mockDeptModel.findOne.mockResolvedValue(null);
      mockDeptModel.create.mockResolvedValue(mockDept);
      const res = await service.create({ name: 'Engineering' });
      expect(res).toBeDefined();
      expect(mockDeptModel.create).toHaveBeenCalledWith(expect.objectContaining({ code: expect.any(String) }));
    });

    it('throws ConflictException if name exists', async () => {
      mockDeptModel.findOne.mockResolvedValue({ name: 'Engineering' });
      await expect(service.create({ name: 'Engineering' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns all departments', async () => {
      mockDeptModel.find.mockReturnValue(chainable([mockDept]));
      const res = await service.findAll();
      expect(res).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('returns dept by id', async () => {
      mockDeptModel.findById.mockReturnValue(chainable(mockDept));
      const res = await service.findOne('dept1');
      expect(res.name).toBe('Engineering');
    });

    it('throws NotFound if not exists', async () => {
      mockDeptModel.findById.mockReturnValue(chainable(null));
      await expect(service.findOne('404')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates dept', async () => {
      mockDeptModel.findOne.mockResolvedValue(null);
      mockDeptModel.findByIdAndUpdate.mockReturnValue(chainable(mockDept));
      const res = await service.update('dept1', { name: 'New Eng' });
      expect(res).toBeDefined();
    });

    it('throws Conflict if name taken by another', async () => {
      mockDeptModel.findOne.mockResolvedValue({ _id: 'other', name: 'HR' });
      await expect(service.update('dept1', { name: 'HR' })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('removes dept if no users assigned', async () => {
      mockUserModel.countDocuments.mockResolvedValue(0);
      mockDeptModel.findByIdAndDelete.mockReturnValue(chainable(mockDept));
      const res = await service.remove('dept1');
      expect(res).toBeDefined();
    });

    it('throws BadRequest if users assigned', async () => {
      mockUserModel.countDocuments.mockResolvedValue(5);
      await expect(service.remove('dept1')).rejects.toThrow(BadRequestException);
    });
  });
});
