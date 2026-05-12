import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';

describe('DepartmentsController', () => {
  let controller: DepartmentsController;
  let service: jest.Mocked<DepartmentsService>;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [{ provide: DepartmentsService, useValue: mockService }],
    }).compile();

    controller = module.get<DepartmentsController>(DepartmentsController);
    service = module.get(DepartmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('calls service.create', async () => {
      service.create.mockResolvedValue({ name: 'HR' } as any);
      await controller.create({ name: 'HR' });
      expect(service.create).toHaveBeenCalledWith({ name: 'HR' });
    });
  });

  describe('findAll', () => {
    it('calls service.findAll', async () => {
      service.findAll.mockResolvedValue([]);
      await controller.findAll();
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('calls service.findOne', async () => {
      service.findOne.mockResolvedValue({ name: 'HR' } as any);
      await controller.findOne('123');
      expect(service.findOne).toHaveBeenCalledWith('123');
    });
  });

  describe('update', () => {
    it('calls service.update', async () => {
      service.update.mockResolvedValue({ name: 'HR v2' } as any);
      await controller.update('123', { name: 'HR v2' });
      expect(service.update).toHaveBeenCalledWith('123', { name: 'HR v2' });
    });
  });

  describe('remove', () => {
    it('calls service.remove', async () => {
      service.remove.mockResolvedValue({ success: true } as any);
      await controller.remove('123');
      expect(service.remove).toHaveBeenCalledWith('123');
    });
  });
});
