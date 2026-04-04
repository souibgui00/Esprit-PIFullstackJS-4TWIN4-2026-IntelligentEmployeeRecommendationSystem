import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  manager_id?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  code?: string;
}