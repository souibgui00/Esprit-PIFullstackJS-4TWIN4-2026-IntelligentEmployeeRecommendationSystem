import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UsersService } from './users.service';
import { CvExtractionService } from '../common/services/cv-extraction.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { Request } from 'express';
import { AuditService } from '../common/audit/audit.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly cvExtractionService: CvExtractionService,
    private readonly auditService: AuditService,
  ) { }

  private buildCvSkillScoreSummary(userDoc: any, extractedSkillIds: string[]) {
    const extractedSet = new Set(extractedSkillIds.map((id) => id.toString()));
    const extractedSkills = (userDoc.skills || []).filter((s: any) => {
      const skillId = s.skillId?._id?.toString?.() || s.skillId?.toString?.();
      return skillId && extractedSet.has(skillId);
    });

    const totalScore = extractedSkills.reduce((sum: number, s: any) => sum + (s.score || 0), 0);
    const averageScore = extractedSkills.length > 0 ? totalScore / extractedSkills.length : 0;

    return {
      extractedSkillsCount: extractedSkills.length,
      extractedSkills,
      extractedSkillsAverageScore: Math.round(averageScore * 10) / 10,
    };
  }

  // ─── /users/me  (must be before :id routes) ──────────────────────────────────

  @Roles(Role.MANAGER, Role.ADMIN, Role.EMPLOYEE, Role.HR)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads'),
      filename: (req: any, file: any, cb: any) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  async uploadAvatar(@Req() req: Request, @UploadedFile() file: any) {
    const user = (req as any).user;
    const avatarUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/${file.filename}`;
    return this.usersService.update(user.userId, { avatar: avatarUrl });
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.EMPLOYEE, Role.HR)
  @Post('me/cv')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads'),
      filename: (req: any, file: any, cb: any) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  async uploadMyCv(@Req() req: Request, @UploadedFile() file: any) {
    try {
      this.logger.log(`Employee CV upload request for file: ${file.originalname}`);

      const user = (req as any).user;
      const cvUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/${file.filename}`;

      await this.usersService.update(user.userId, { cvUrl });

      this.logger.log(`Starting skill extraction from CV: ${file.path}`);
      const skillIds = await this.cvExtractionService.extractDataFromCV(file.path);

      const currentUserDoc = await this.usersService.findOne(user.userId);
      const exp = currentUserDoc?.yearsOfExperience || 0;
      let inferredLevel = 'beginner';
      if (exp >= 10) inferredLevel = 'advanced'; // Note: Cap at advanced for auto-discovery
      else if (exp >= 4) inferredLevel = 'intermediate';
      
      for (const skillId of skillIds) {
        try {
          await this.usersService.addSkillToUser(user.userId, {
            skillId,
            level: inferredLevel,
            auto_eval: 0,
            hierarchie_eval: 0,
          });
        } catch (e: any) {
          this.logger.warn(`Skill ${skillId} already existed for user ${user.userId}; kept existing evaluation values.`);
        }
      }

      this.logger.log(`CV upload and skill extraction completed for user ${user.userId}. Found ${skillIds.length} skills.`);
      const updatedUser = await this.usersService.findOne(user.userId);
      return {
        message: 'CV uploaded and scores calculated from extracted skills',
        user: updatedUser,
        cvSkillScoreSummary: this.buildCvSkillScoreSummary(updatedUser, skillIds),
      };
    } catch (error: any) {
      this.logger.error(`CV upload failed: ${error.message}`, error.stack);
      throw new Error(`CV upload failed: ${error.message}`);
    }
  }

  @Roles(Role.ADMIN, Role.HR)
  @Post(':id/cv')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads'),
      filename: (req: any, file: any, cb: any) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  async uploadUserCv(@Param('id') id: string, @UploadedFile() file: any) {
    const cvUrl = `${process.env.BACKEND_URL || 'http://localhost:3001'}/uploads/${file.filename}`;

    await this.usersService.update(id, { cvUrl });

    const currentUserDoc = await this.usersService.findOne(id);
    const exp = currentUserDoc?.yearsOfExperience || 0;
    let inferredLevel = 'beginner';
    if (exp >= 10) inferredLevel = 'advanced';
    else if (exp >= 4) inferredLevel = 'intermediate';

    const skillIds = await this.cvExtractionService.extractDataFromCV(file.path);
    for (const skillId of skillIds) {
      try {
        await this.usersService.addSkillToUser(id, {
          skillId,
          level: inferredLevel,
          auto_eval: 0,
          hierarchie_eval: 0,
        });
      } catch {
        this.logger.warn(`Skill ${skillId} already existed for user ${id}; kept existing evaluation values.`);
      }
    }

    const updatedUser = await this.usersService.findOne(id);
    return {
      message: 'CV uploaded and scores calculated from extracted skills',
      user: updatedUser,
      cvSkillScoreSummary: this.buildCvSkillScoreSummary(updatedUser, skillIds),
    };
  }

  @Roles(Role.ADMIN, Role.HR)
  @Post('extract-cv')
  @UseInterceptors(FileInterceptor('file'))
  async extractCvData(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('No file provided');
    }

    try {
      this.logger.log(`Processing CV extraction request for file: ${file.originalname}, size: ${file.size}, type: ${file.mimetype}`);

      if (!file.buffer) {
        throw new Error('File buffer is empty');
      }

      const result = await this.cvExtractionService.extractProfileFromBuffer(file.buffer, file.mimetype);

      if (!result) {
        throw new Error('Could not extract any data from the CV file');
      }

      this.logger.log(`CV extraction successful for ${file.originalname}`);
      return result;
    } catch (error: any) {
      this.logger.error(`CV extraction failed for ${file.originalname}: ${error.message}`, error.stack);
      throw new Error(`CV extraction failed: ${error.message}`);
    }
  }

  @Get('me')
  async getMe(@Req() req: Request) {
    const user = (req as any).user;
    return this.usersService.findOne(user.userId);
  }

  @Patch('me/password')
  async changePassword(
    @Req() req: Request,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    const user = (req as any).user;
    return this.usersService.changePassword(
      user.userId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Patch('me')
  async updateMe(@Req() req: Request, @Body() body: UpdateUserDto) {
    const user = (req as any).user;
    return this.usersService.update(user.userId, body);
  }

  @Patch('me/skills/:skillId/eval')
  async selfEvalSkill(
    @Req() req: Request,
    @Param('skillId') skillId: string,
    @Body('auto_eval') auto_eval: number,
  ) {
    const user = (req as any).user;
    return this.usersService.updateUserSkill(user.userId, skillId, { auto_eval });
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  @Roles(Role.ADMIN, Role.HR)
  @Post()
  async create(@Req() req: Request, @Body() body: CreateUserDto) {
    const user = await this.usersService.create(body);
    await this.auditService.logAction({
      action: 'CREATE_USER',
      entityType: 'USER',
      entityId: (user as any)._id?.toString() || (user as any).id,
      actorId: (req as any).user.userId,
      newValue: body,
    });
    return user;
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.EMPLOYEE, Role.HR)
  @Get()
  async findAll(
    @Query('role') role?: string,
    @Query('lightweight') lightweight?: string,
  ) {
    const useLightweight = typeof lightweight === 'string'
      ? lightweight.toLowerCase() === 'true'
      : !!lightweight;

    return useLightweight
      ? this.usersService.findAllLightweight(role)
      : this.usersService.findAll(role);
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.HR)
  @Get('weighted-scores')
  async getAllWeightedScores() {
    return this.usersService.calculateAllEmployeesWeightedSkillScores();
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.EMPLOYEE, Role.HR)
  @Get(':id/weighted-score')
  async getEmployeeWeightedScore(@Param('id') id: string) {
    return this.usersService.calculateEmployeeWeightedSkillScore(id);
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.EMPLOYEE, Role.HR)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.EMPLOYEE, Role.HR)
  @Put(':id')
  async update(@Req() req: Request, @Param('id') id: string, @Body() body: UpdateUserDto) {
    const before = await this.usersService.findOne(id);
    const updated = await this.usersService.update(id, body);
    await this.auditService.logAction({
      action: 'UPDATE_USER',
      entityType: 'USER',
      entityId: id,
      actorId: (req as any).user.userId,
      oldValue: before,
      newValue: body,
    });
    return updated;
  }

  @Roles(Role.ADMIN, Role.HR)
  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string) {
    const before = await this.usersService.findOne(id);
    const result = await this.usersService.remove(id);
    await this.auditService.logAction({
      action: 'DELETE_USER',
      entityType: 'USER',
      entityId: id,
      actorId: (req as any).user.userId,
      oldValue: before,
    });
    return result;
  }

  // ─── Role change (admin-only) ─────────────────────────────────────────────────

  @Roles(Role.ADMIN, Role.HR)
  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    const normalizedRole = role?.toUpperCase() as Role;
    if (!Object.values(Role).includes(normalizedRole)) {
      throw new Error(`Invalid role: ${role}`);
    }
    return this.usersService.updateRole(id, normalizedRole);
  }

  @Roles(Role.ADMIN, Role.HR)
  @Post(':id/recompute-skill-scores')
  async recomputeUserSkillScores(
    @Param('id') id: string,
    @Body('normalizeCvBaseline') normalizeCvBaseline?: boolean,
  ) {
    return this.usersService.recomputeUserSkillScores(id, {
      normalizeCvBaseline: normalizeCvBaseline ?? true,
    });
  }

  @Roles(Role.ADMIN, Role.HR)
  @Post('recompute-skill-scores')
  async recomputeAllUsersSkillScores(
    @Body('normalizeCvBaseline') normalizeCvBaseline?: boolean,
  ) {
    return this.usersService.recomputeAllUsersSkillScores({
      normalizeCvBaseline: normalizeCvBaseline ?? true,
    });
  }

  @Roles(Role.ADMIN, Role.HR)
  @Post('heal-skill-objectids')
  async healSkillObjectIds() {
    return this.usersService.healSkillObjectIds();
  }

  // ─── Skill endpoints ──────────────────────────────────────────────────────────

  @Roles(Role.ADMIN, Role.HR)
  @Post(':id/skills')
  async addSkill(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.usersService.addSkillToUser(id, body);
  }

  @Roles(Role.ADMIN, Role.MANAGER, Role.HR)
  @Patch(':id/skills/:skillId')
  async updateSkill(
    @Param('id') id: string,
    @Param('skillId') skillId: string,
    @Body() body: any,
  ) {
    return this.usersService.updateUserSkill(id, skillId, body);
  }

  @Roles(Role.ADMIN, Role.HR)
  @Delete(':id/skills/:skillId')
  async removeSkill(
    @Param('id') id: string,
    @Param('skillId') skillId: string,
  ) {
    return this.usersService.removeSkillFromUser(id, skillId);
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.EMPLOYEE, Role.HR)
  @Post(':id/skills/:skillId/calculate-score')
  async calculateSkillScore(
    @Param('id') id: string,
    @Param('skillId') skillId: string,
  ) {
    return this.usersService.calculateSkillScore(id, skillId);
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.EMPLOYEE, Role.HR)
  @Get(':id/global-activity-score')
  async getGlobalActivityScore(@Param('id') id: string) {
    return this.usersService.calculateGlobalActivityScore(id);
  }

  @Roles(Role.MANAGER, Role.ADMIN, Role.EMPLOYEE, Role.HR)
  @Get(':id/combined-score')
  async getCombinedScore(@Param('id') id: string) {
    return this.usersService.getCombinedScore(id);
  }
}
