import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePostDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(3000)
    content?: string;

    @IsOptional()
    @IsEnum(['update', 'announcement', 'achievement'])
    type?: string;

    @IsOptional()
    @IsBoolean()
    isPinned?: boolean;
}
