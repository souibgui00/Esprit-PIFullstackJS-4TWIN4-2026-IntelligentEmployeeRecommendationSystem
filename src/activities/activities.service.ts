import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity } from './schema/activity.schema';
import { CreateActivityDto, UpdateActivityDto } from './dto/activity.dto';

@Injectable()
export class ActivitiesService {
    constructor(
        @InjectModel(Activity.name)
        private activityModel: Model<Activity>,
    ) { }

    async create(createActivityDto: CreateActivityDto): Promise<Activity> {
        const createdActivity = new this.activityModel(createActivityDto);
        return createdActivity.save();
    }

    async findAll(): Promise<Activity[]> {
        return this.activityModel.find().exec();
    }

    async findOne(id: string): Promise<Activity | null> {
        return this.activityModel.findById(id).exec();
    }

    async update(id: string, updateActivityDto: UpdateActivityDto): Promise<Activity | null> {
        return this.activityModel.findByIdAndUpdate(id, updateActivityDto, { new: true }).exec();
    }

    async remove(id: string): Promise<any> {
        return this.activityModel.findByIdAndDelete(id).exec();
    }

    async enroll(id: string): Promise<Activity | null> {
        return this.activityModel.findByIdAndUpdate(
            id,
            { $inc: { enrolledCount: 1 } },
            { new: true }
        ).exec();
    }

    async unenroll(id: string): Promise<Activity | null> {
        return this.activityModel.findByIdAndUpdate(
            id,
            { $inc: { enrolledCount: -1 } },
            { new: true }
        ).exec();
    }
}
