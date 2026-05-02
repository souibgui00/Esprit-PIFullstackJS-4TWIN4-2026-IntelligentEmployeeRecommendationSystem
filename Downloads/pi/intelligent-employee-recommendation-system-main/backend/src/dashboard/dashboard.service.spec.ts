import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { UsersService } from '../users/users.service';
import { ActivitiesService } from '../activities/activities.service';
import { DepartmentsService } from '../departments/departments.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockUsersService = {
    findAll: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
  };

  const mockActivitiesService = {
    findAll: jest.fn().mockResolvedValue([{ id: 101 }, { id: 102 }, { id: 103 }]),
  };

  const mockDepartmentsService = {
    findAll: jest.fn().mockResolvedValue([{ id: 201 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: ActivitiesService, useValue: mockActivitiesService },
        { provide: DepartmentsService, useValue: mockDepartmentsService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('should return stats for ADMIN role', async () => {
      const stats = await service.getStats('ADMIN', 'user123');
      
      expect(stats.users.total).toBe(2);
      expect(stats.activities.total).toBe(3);
      expect(stats.departments.total).toBe(1);
      expect(stats.activities.recent).toHaveLength(3);
    });

    it('should return 0 users for non-admin role', async () => {
      const stats = await service.getStats('EMPLOYEE', 'user123');
      expect(stats.users.total).toBe(0);
    });
  });
});
