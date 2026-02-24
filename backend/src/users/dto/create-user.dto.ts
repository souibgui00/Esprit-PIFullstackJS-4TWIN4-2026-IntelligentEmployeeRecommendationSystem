import {
  IsString,
  IsEmail,
  IsOptional,
  IsDate,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Types } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsString()
  matricule!: string;

  @IsString()
  telephone!: string;

  @IsEmail()
  email!: string;

  @IsString()
  password!: string;

  @IsDate()
  date_embauche!: Date;

  department_id!: Types.ObjectId;

  @IsOptional()
  manager_id?: Types.ObjectId;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  en_ligne?: boolean;
}

