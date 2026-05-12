import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schema/user.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class FaceRecognitionService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async getFaceProfile(email: string) {
    const user = await this.userModel
      .findOne({ email })
      .select('name email facePicture isFaceIdEnabled avatar');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      name: user.name,
      email: user.email,
      picture: user.facePicture || user.avatar,
      isFaceIdEnabled: user.isFaceIdEnabled,
    };
  }

  async registerFace(userId: string, file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadFile(file);
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          facePicture: result.secure_url,
          isFaceIdEnabled: true,
        },
        { new: true },
      )
      .select('-password');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async disableFaceId(userId: string) {
    return this.userModel
      .findByIdAndUpdate(userId, { isFaceIdEnabled: false }, { new: true })
      .select('-password');
  }
}
