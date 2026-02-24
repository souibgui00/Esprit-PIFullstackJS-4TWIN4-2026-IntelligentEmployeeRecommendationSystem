import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schema/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) { }

  async create(data: Partial<User>) {
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }
    const user = new this.userModel(data);
    return await user.save();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }


  async findAll() {
    return this.userModel.find().select('-password');
  }
  async findOne(id: string) {
    return this.userModel.findById(id);
  }

  async update(id: string, data: UpdateUserDto) {
    return this.userModel.findByIdAndUpdate(id, data, {
      new: true,
    });
  }

  async remove(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}
