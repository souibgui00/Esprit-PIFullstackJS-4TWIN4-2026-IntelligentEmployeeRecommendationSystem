import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FaceRecognitionController } from './face-recognition.controller';
import { FaceRecognitionService } from './face-recognition.service';
import { User, UserSchema } from '../users/schema/user.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        CloudinaryModule,
    ],
    controllers: [FaceRecognitionController],
    providers: [FaceRecognitionService],
    exports: [FaceRecognitionService],
})
export class FaceRecognitionModule { }
