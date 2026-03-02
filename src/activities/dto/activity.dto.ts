import { IsString, IsEnum, IsOptional, IsNumber, IsArray } from 'class-validator';

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
}
