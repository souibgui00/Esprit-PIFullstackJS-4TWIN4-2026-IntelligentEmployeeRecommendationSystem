import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateSkillDto {
    @IsString()
    name!: string;

    @IsEnum(['technique', 'comportementale', 'transverse', 'opérationnelle'])
    type!: string;

    @IsOptional()
    @IsEnum(['draft', 'submitted', 'validated'])
    etat?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    auto_eval?: number;

    @IsOptional()
    hierarchie_eval?: number;
}

export class UpdateSkillDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEnum(['technique', 'comportementale', 'transverse', 'opérationnelle'])
    type?: string;

    @IsOptional()
    @IsEnum(['draft', 'submitted', 'validated'])
    etat?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    auto_eval?: number;

    @IsOptional()
    hierarchie_eval?: number;
}
