import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';


@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Roles(Role.HR, Role.ADMIN)
  @Post()
  async create(@Body() body: CreateUserDto) {
    console.log('[UsersController] POST /users - Creating user with data:', body);
    const result = await this.usersService.create(body);
    console.log('[UsersController] User created successfully:', result);
    return result;
  }

  @Roles(Role.HR, Role.MANAGER, Role.ADMIN, Role.EMPLOYEE)
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }


  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.usersService.findOne(id);
  }

  @Roles(Role.HR, Role.MANAGER, Role.ADMIN, Role.EMPLOYEE)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return await this.usersService.update(id, body);
  }

  @Roles(Role.HR, Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.usersService.remove(id);
  }
}
