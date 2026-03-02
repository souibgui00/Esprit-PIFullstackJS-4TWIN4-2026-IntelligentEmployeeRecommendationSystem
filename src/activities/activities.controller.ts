import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Patch } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto, UpdateActivityDto } from './dto/activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivitiesController {
    constructor(private readonly activitiesService: ActivitiesService) { }

    @Roles(Role.HR, Role.ADMIN)
    @Post()
    create(@Body() createActivityDto: CreateActivityDto) {
        return this.activitiesService.create(createActivityDto);
    }

    @Get()
    findAll() {
        return this.activitiesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.activitiesService.findOne(id);
    }

    @Roles(Role.HR, Role.ADMIN)
    @Put(':id')
    update(@Param('id') id: string, @Body() updateActivityDto: UpdateActivityDto) {
        return this.activitiesService.update(id, updateActivityDto);
    }

    @Roles(Role.HR, Role.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.activitiesService.remove(id);
    }

    @Roles(Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE)
    @Patch(':id/enroll')
    enroll(@Param('id') id: string) {
        return this.activitiesService.enroll(id);
    }

    @Roles(Role.ADMIN, Role.HR, Role.MANAGER, Role.EMPLOYEE)
    @Patch(':id/unenroll')
    unenroll(@Param('id') id: string) {
        return this.activitiesService.unenroll(id);
    }
}
