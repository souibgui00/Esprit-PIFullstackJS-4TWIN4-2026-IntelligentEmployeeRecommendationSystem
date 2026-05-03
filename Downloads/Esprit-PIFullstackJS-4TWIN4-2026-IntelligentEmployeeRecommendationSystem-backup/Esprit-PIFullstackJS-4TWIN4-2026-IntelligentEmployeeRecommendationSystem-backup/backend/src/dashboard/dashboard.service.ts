import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ActivitiesService } from '../activities/activities.service';
import { DepartmentsService } from '../departments/departments.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly usersService: UsersService,
    private readonly activitiesService: ActivitiesService,
    private readonly departmentsService: DepartmentsService,
  ) {}

  async getStats(userRole: string, userId: string) {
    const [
      totalUsers,
      totalActivities,
      totalDepartments,
      recentActivities,
    ] = await Promise.all([
      this.getUsersCount(userRole),
      this.getActivitiesCount(userRole, userId),
      this.getDepartmentsCount(),
      this.getRecentActivities(userRole, userId),
    ]);

    return {
      users: {
        total: totalUsers,
      },
      activities: {
        total: totalActivities,
        recent: recentActivities,
      },
      departments: {
        total: totalDepartments,
      },
    };
  }

  private async getUsersCount(userRole: string): Promise<number> {
    if (userRole === 'ADMIN' || userRole === 'HR') {
      const users = await this.usersService.findAll();
      return users.length;
    }
    return 0;
  }

  private async getActivitiesCount(userRole: string, userId: string): Promise<number> {
    const activities = await this.activitiesService.findAll(userRole, userId);
    return activities.length;
  }

  private async getDepartmentsCount(): Promise<number> {
    const departments = await this.departmentsService.findAll();
    return departments.length;
  }

  private async getRecentActivities(userRole: string, userId: string) {
    const activities = await this.activitiesService.findAll(userRole, userId);
    return activities.slice(0, 5); // Return 5 most recent activities
  }
}
