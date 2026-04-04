import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { CreateSkillDto, UpdateSkillDto } from './dto/skills.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('skills')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SkillsController {
    constructor(private readonly skillsService: SkillsService) { }

    @Roles(Role.HR, Role.ADMIN)
    @Post()
    create(@Body() createSkillDto: CreateSkillDto) {
        return this.skillsService.create(createSkillDto);
    }

    @Get()
    findAll() {
        return this.skillsService.findAll();
    }

    @Roles(Role.HR, Role.MANAGER, Role.ADMIN)
    @Get('dashboard/global')
    getGlobalDashboard() {
        return this.skillsService.getGlobalSkillsDashboard();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.skillsService.findOne(id);
    }

    @Roles(Role.HR, Role.ADMIN)
    @Put(':id')
    update(@Param('id') id: string, @Body() updateSkillDto: UpdateSkillDto) {
        return this.skillsService.update(id, updateSkillDto);
    }

    @Roles(Role.HR, Role.ADMIN)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.skillsService.remove(id);
    }
}
