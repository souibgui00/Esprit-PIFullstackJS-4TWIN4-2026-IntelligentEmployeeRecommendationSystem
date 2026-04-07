import { IsString, IsEnum, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RequiredSkillDto {
  @IsString()
  skillId!: string;

  @IsNumber()
  weight!: number;

  @IsString()
  requiredLevel!: string;
}

export class CreateActivityDto {
    @IsString()
    title!: string;

    @IsString()
    description!: string;

    @IsEnum(['training', 'workshop', 'mentoring', 'webinar'])
    type!: string;

    @IsString()
    date!: string;

    @IsString()
    duration!: string;

    @IsOptional()
    @IsNumber()
    capacity?: number;

    @IsOptional()
    @IsEnum(['open', 'closed', 'completed'])
    status?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skillsCovered?: string[];

    @IsOptional()
    @IsEnum(['beginner', 'intermediate', 'advanced'])
    level?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RequiredSkillDto)
    requiredSkills?: RequiredSkillDto[];

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    targetDepartments?: string[];

    @IsOptional()
    @IsString()
    organizerId?: string;

    @IsOptional()
    @IsEnum(['development', 'performance', 'balanced'])
    intent?: string;
}

export class UpdateActivityDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(['training', 'workshop', 'mentoring', 'webinar'])
    type?: string;

    @IsOptional()
    @IsString()
    date?: string;

    @IsOptional()
    @IsString()
    duration?: string;

    @IsOptional()
    @IsNumber()
    capacity?: number;

    @IsOptional()
    @IsEnum(['open', 'closed', 'completed'])
    status?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skillsCovered?: string[];

    @IsOptional()
    @IsEnum(['beginner', 'intermediate', 'advanced'])
    level?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RequiredSkillDto)
    requiredSkills?: RequiredSkillDto[];

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    targetDepartments?: string[];

    @IsOptional()
    @IsString()
    organizerId?: string;

    @IsOptional()
    @IsEnum(['development', 'performance', 'balanced'])
    intent?: string;
}
