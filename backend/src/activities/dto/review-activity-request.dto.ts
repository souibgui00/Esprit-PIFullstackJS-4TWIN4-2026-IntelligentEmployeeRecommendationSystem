import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class ReviewActivityRequestDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  status!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
