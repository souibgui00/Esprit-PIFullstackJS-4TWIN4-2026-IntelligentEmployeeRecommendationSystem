import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignmentsService } from './assignments.service';
import { ForwardToManagerDto } from './dto/forward-to-manager.dto';
import { ForwardToDepartmentManagerDto } from './dto/forward-to-department-manager.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignmentsController {
    constructor(private readonly assignmentsService: AssignmentsService) { }

    @Post()
    async create(
        @Req() req: any,
        @Body('userId') userId: string,
        @Body('activityId') activityId: string
    ) {
        return this.assignmentsService.create(userId, activityId, req.user.userId);
    }

    @Roles(Role.ADMIN, Role.HR)
    @Post('forward-to-manager')
    async forwardToManager(
        @Req() req: any,
        @Body() forwardDto: ForwardToManagerDto
    ) {
        return this.assignmentsService.forwardToManager(forwardDto, req.user.userId);
    }

    @Roles(Role.ADMIN, Role.HR)
    @Post('forward-to-department-manager')
    async forwardToDepartmentManager(
        @Req() req: any,
        @Body() forwardDto: ForwardToDepartmentManagerDto,
    ) {
        if (!forwardDto?.activityId) {
            throw new BadRequestException('activityId is required');
        }
        if (!Array.isArray(forwardDto?.candidateIds) || forwardDto.candidateIds.length === 0) {
            throw new BadRequestException('candidateIds must contain at least one employee');
        }

        return this.assignmentsService.forwardToDepartmentManagers(forwardDto, req.user.userId);
    }

    @Get()
    async getAssignments(@Req() req: any) {
        // Simple logic for fetching relevant assignments based on access role
        const role = req.user.role?.toLowerCase();
        if (role === 'admin' || role === 'hr') {
            return this.assignmentsService.findAll();
        } else if (role === 'manager') {
            // Managers see both: assignments they created AND recommendations for them
            const created = await this.assignmentsService.findByAssigner(req.user.userId);
            const recommended = await this.assignmentsService.findRecommendationsForManager(req.user.userId);
            return [...created, ...recommended];
        } else {
            return this.assignmentsService.findByRecipient(req.user.userId);
        }
    }

    @Get('me')
    async getMyAssignments(@Req() req: any) {
        return this.assignmentsService.findByRecipient(req.user.userId);
    }

    @Roles(Role.MANAGER)
    @Patch(':id/status')
    async updateStatus(
        @Req() req: any,
        @Param('id') id: string,
        @Body('status') status: 'accepted' | 'rejected',
    ) {
        if (status !== 'accepted' && status !== 'rejected') {
            throw new BadRequestException("status must be either 'accepted' or 'rejected'");
        }

        return this.assignmentsService.updateStatus(id, status, req.user.userId);
    }

    @Roles(Role.EMPLOYEE)
    @Post(':id/accept')
    async employeeAccept(
        @Req() req: any,
        @Param('id') id: string,
    ) {
        return this.assignmentsService.employeeAccept(id, req.user.userId);
    }

    @Roles(Role.EMPLOYEE)
    @Post(':id/reject')
    async employeeReject(
        @Req() req: any,
        @Param('id') id: string,
        @Body('reason') reason: string,
    ) {
        return this.assignmentsService.employeeReject(id, req.user.userId, reason);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.assignmentsService.remove(id);
    }
}
