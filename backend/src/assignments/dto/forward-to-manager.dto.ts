import { IsArray, IsString, IsOptional, IsNumber } from 'class-validator';

export class ForwardToManagerDto {
    @IsArray()
    @IsString({ each: true })
    candidateIds!: string[];

    @IsString()
    activityId!: string;

    @IsString()
    managerId!: string;

    @IsOptional()
    @IsNumber()
    aiScore?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skillGaps?: string[];

    @IsOptional()
    @IsString()
    reason?: string;
}
