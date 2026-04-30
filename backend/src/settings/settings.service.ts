import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting } from './schema/setting.schema';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name) private settingModel: Model<Setting>,
  ) {}

  async get(key: string): Promise<any> {
    const setting = await this.settingModel.findOne({ key }).exec();
    return setting ? setting.value : null;
  }

  async set(key: string, value: any): Promise<Setting> {
    return this.settingModel
      .findOneAndUpdate(
        { key },
        { value },
        { upsrert: true, new: true, setDefaultsOnInsert: true, upsert: true },
      )
      .exec() as any;
  }

  async findAll(): Promise<any> {
    const settings = await this.settingModel.find().exec();
    return settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as any);
  }
}
