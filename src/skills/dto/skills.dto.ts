import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateSkillDto {
    @IsString()
    name!: string;

    @IsEnum(['knowledge', 'knowHow', 'softSkill'])
    type!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    category?: string;
}

export class UpdateSkillDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEnum(['knowledge', 'knowHow', 'softSkill'])
    type?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    category?: string;
}
