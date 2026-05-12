import { IsArray, IsString, IsOptional, IsNumber } from 'class-validator';

export class ForwardToDepartmentManagerDto {
  @IsString()
  activityId!: string;

  @IsArray()
  @IsString({ each: true })
  candidateIds!: string[];

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsNumber()
  aiScore?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skillGaps?: string[];
}
