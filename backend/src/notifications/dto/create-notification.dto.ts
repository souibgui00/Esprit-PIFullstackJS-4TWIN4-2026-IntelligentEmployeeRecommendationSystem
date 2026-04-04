import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsObject } from 'class-validator';

export class CreateNotificationDto {
    @IsNotEmpty()
    @IsString()
    recipientId!: string;

    @IsNotEmpty()
    @IsString()
    title!: string;

    @IsNotEmpty()
    @IsString()
    message!: string;

    @IsNotEmpty()
    @IsString()
    type!: string;

    @IsOptional()
    @IsObject()
    metadata?: any;
}
