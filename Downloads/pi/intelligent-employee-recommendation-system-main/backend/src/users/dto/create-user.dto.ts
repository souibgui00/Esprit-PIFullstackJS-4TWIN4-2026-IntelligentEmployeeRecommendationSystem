import { IsString, IsEmail, IsOptional, IsMongoId } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  matricule?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsMongoId({ message: 'department_id must be a valid MongoDB ID' })
  department_id?: string;

  @IsOptional()
  @IsString()
  date_embauche?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  jobDescription?: string;

  @IsOptional()
  @IsMongoId({ message: 'manager_id must be a valid MongoDB ID' })
  manager_id?: string;

  @IsOptional()
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  cvUrl?: string;
}
