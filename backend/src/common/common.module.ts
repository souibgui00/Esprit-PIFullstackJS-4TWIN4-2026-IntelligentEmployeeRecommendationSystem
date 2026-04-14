import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './services/email.service';
import { CvExtractionService } from './services/cv-extraction.service';
import { SkillsModule } from '../skills/skills.module';

@Module({
  imports: [ConfigModule, forwardRef(() => SkillsModule)],
  providers: [EmailService, CvExtractionService],
  exports: [EmailService, CvExtractionService],
})
export class CommonModule { }
