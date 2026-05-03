import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { UnauthorizedException } from '@nestjs/common';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: DashboardService;

  const mockDashboardService = {
    getStats: jest.fn(),
  };

  const mockUser = {
    userId: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'ADMIN',
    matricule: 'EMP-001',
    department_id: 'dept-001',
  };

  const mockRequest = {
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: mockDashboardService },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    dashboardService = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStats', () => {
    it('should return dashboard stats for admin user', async () => {
      const mockStats: any = {
        users: {
          total: 150,
        },
        activities: {
          total: 25,
          recent: [
            { id: '1', title: 'Activity 1', status: 'completed' },
            { id: '2', title: 'Activity 2', status: 'ongoing' },
          ],
        },
        departments: {
          total: 10,
        },
      };

      jest.spyOn(dashboardService, 'getStats').mockResolvedValue(mockStats);

      const result = await controller.getStats(mockRequest);

      expect(result).toEqual(mockStats);
      expect(dashboardService.getStats).toHaveBeenCalledWith(mockUser.role, mockUser.userId);
    });

    it('should return dashboard stats for HR user', async () => {
      const hrUser = { ...mockUser, role: 'HR' };
      const hrRequest = { user: hrUser };

      const mockStats: any = {
        users: {
          total: 120,
        },
        activities: {
          total: 30,
          recent: [
            { id: '3', title: 'HR Training', status: 'completed' },
            { id: '4', title: 'Leadership Workshop', status: 'ongoing' },
          ],
        },
        departments: {
          total: 8,
        },
      };

      jest.spyOn(dashboardService, 'getStats').mockResolvedValue(mockStats);

      const result = await controller.getStats(hrRequest);

      expect(result).toEqual(mockStats);
      expect(dashboardService.getStats).toHaveBeenCalledWith(hrUser.role, hrUser.userId);
    });

    it('should return dashboard stats for manager user', async () => {
      const managerUser = { ...mockUser, role: 'MANAGER' };
      const managerRequest = { user: managerUser };

      const mockStats: any = {
        users: {
          total: 0, // Managers can't see total users
        },
        activities: {
          total: 15,
          recent: [
            { id: '5', title: 'Team Meeting', status: 'completed' },
            { id: '6', title: 'Project Review', status: 'ongoing' },
          ],
        },
        departments: {
          total: 5,
        },
      };

      jest.spyOn(dashboardService, 'getStats').mockResolvedValue(mockStats);

      const result = await controller.getStats(managerRequest);

      expect(result).toEqual(mockStats);
      expect(dashboardService.getStats).toHaveBeenCalledWith(managerUser.role, managerUser.userId);
    });

    it('should return empty stats for employee user', async () => {
      const employeeUser = { ...mockUser, role: 'EMPLOYEE' };
      const employeeRequest = { user: employeeUser };

      const mockStats: any = {
        users: {
          total: 0, // Employees can't see total users
        },
        activities: {
          total: 5,
          recent: [
            { id: '7', title: 'Personal Training', status: 'completed' },
            { id: '8', title: 'Skill Development', status: 'ongoing' },
          ],
        },
        departments: {
          total: 0, // Employees can't see total departments
        },
      };

      jest.spyOn(dashboardService, 'getStats').mockResolvedValue(mockStats);

      const result = await controller.getStats(employeeRequest);

      expect(result).toEqual(mockStats);
      expect(dashboardService.getStats).toHaveBeenCalledWith(employeeUser.role, employeeUser.userId);
    });

    it('should handle service errors gracefully', async () => {
      jest.spyOn(dashboardService, 'getStats').mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(controller.getStats(mockRequest)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle missing user in request', async () => {
      const emptyRequest = { user: null };

      await expect(controller.getStats(emptyRequest)).rejects.toThrow(
        'Cannot read properties of null (reading \'role\')'
      );
    });

    it('should handle missing user role', async () => {
      const userWithoutRole = { ...mockUser, role: undefined };
      const requestWithoutRole = { user: userWithoutRole };

      jest.spyOn(dashboardService, 'getStats').mockRejectedValue(
        new Error('User role is required')
      );

      await expect(controller.getStats(requestWithoutRole)).rejects.toThrow(
        'User role is required'
      );
    });
  });
});
