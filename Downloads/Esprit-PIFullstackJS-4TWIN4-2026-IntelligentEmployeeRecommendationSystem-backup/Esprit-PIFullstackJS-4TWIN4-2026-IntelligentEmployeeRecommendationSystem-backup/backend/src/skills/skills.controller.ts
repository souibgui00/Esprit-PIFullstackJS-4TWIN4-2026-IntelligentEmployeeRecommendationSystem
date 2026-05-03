import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { CreateSkillDto, UpdateSkillDto } from './dto/skills.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AuditService } from '../common/audit/audit.service';

@Controller('skills')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SkillsController {
  constructor(
    private readonly skillsService: SkillsService,
    private readonly auditService: AuditService,
  ) {}

  @Roles(Role.HR, Role.ADMIN)
  @Post()
  async create(@Body() createSkillDto: CreateSkillDto, @Req() req: any) {
    const skill = await this.skillsService.create(createSkillDto);
    await this.auditService.logAction({
      action: 'CREATE_SKILL',
      entityType: 'SKILL',
      entityId: (skill as any)._id?.toString() || (skill as any).id,
      actorId: req.user.userId,
      newValue: createSkillDto,
    });
    return skill;
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
  async update(
    @Param('id') id: string,
    @Body() updateSkillDto: UpdateSkillDto,
    @Req() req: any,
  ) {
    const before = await this.skillsService.findOne(id);
    const updated = await this.skillsService.update(id, updateSkillDto);
    await this.auditService.logAction({
      action: 'UPDATE_SKILL',
      entityType: 'SKILL',
      entityId: id,
      actorId: req.user.userId,
      oldValue: before,
      newValue: updateSkillDto,
    });
    return updated;
  }

  @Roles(Role.HR, Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const before = await this.skillsService.findOne(id);
    const result = await this.skillsService.remove(id);
    await this.auditService.logAction({
      action: 'DELETE_SKILL',
      entityType: 'SKILL',
      entityId: id,
      actorId: req.user.userId,
      oldValue: before,
    });
    return result;
  }
}
