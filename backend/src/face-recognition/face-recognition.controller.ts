import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FaceRecognitionService } from './face-recognition.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('face-recognition')
export class FaceRecognitionController {
  constructor(private readonly faceService: FaceRecognitionService) {}

  @Get('profile')
  async getFaceProfile(@Query('email') email: string) {
    return this.faceService.getFaceProfile(email);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('picture', { storage: memoryStorage() }))
  async registerFace(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const user = req.user;
    console.log(
      '[FaceRecognition] Registering face for user:',
      user?.sub,
      '| File size:',
      file?.size,
    );
    return this.faceService.registerFace(user.userId || user.sub, file);
  }

  @Post('disable')
  @UseGuards(JwtAuthGuard)
  async disableFaceId(@Req() req: any) {
    const user = req.user;
    return this.faceService.disableFaceId(user.userId || user.sub);
  }
}
