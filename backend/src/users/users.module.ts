import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schema/user.schema';
import { CommonModule } from '../common/common.module';
import { SkillsModule } from '../skills/skills.module';
import { SkillDecayService } from './skill-decay.service';
import { SkillDecayController } from './skill-decay.controller';
import { AuditModule } from '../common/audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    CommonModule,
    SkillsModule,
    AuditModule,
  ],
  controllers: [UsersController, SkillDecayController],
  providers: [UsersService, SkillDecayService],
  exports: [UsersService, SkillDecayService],
})
export class UsersModule {}
