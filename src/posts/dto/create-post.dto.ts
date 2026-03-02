import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreatePostDto {
    @IsNotEmpty()
    @IsString()
    content!: string;

    @IsOptional()
    @IsEnum(['update', 'announcement', 'achievement'])
    type?: string;

    @IsOptional()
    @IsString()
    authorId?: string;

    @IsOptional()
    @IsString()
    authorName?: string;

    @IsOptional()
    @IsString()
    authorAvatar?: string;
}
