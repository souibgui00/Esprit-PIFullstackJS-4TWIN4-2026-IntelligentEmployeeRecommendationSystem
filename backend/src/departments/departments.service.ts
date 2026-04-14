import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department } from './schema/department.schema';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { User } from '../users/schema/user.schema';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name) private deptModel: Model<Department>,
    @InjectModel(User.name) private userModel: Model<User>
  ) { }

  private generateCode(name: string): string {
    return name
      .split(/[\s-]+/)
      .map(word => word[0])
      .join('')
      .toUpperCase() + '-' + Math.floor(10 + Math.random() * 90);
  }

  async create(dto: CreateDepartmentDto) {
    if (!dto.code) {
      dto.code = this.generateCode(dto.name);
    }

    const exist = await this.deptModel.findOne({
      $or: [{ name: dto.name }, { code: dto.code }]
    });

    if (exist) {
      if (exist.name === dto.name) {
        throw new ConflictException('Department with this name already exists');
      }
      // If code was auto-generated and conflicts, try once more with a different random suffix
      dto.code = this.generateCode(dto.name);
    }

    return this.deptModel.create(dto);
  }

  async findAll() {
    return this.deptModel.find()
      .populate('manager_id', '_id name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    const dept = await this.deptModel.findById(id)
      .populate('manager_id', '_id name email')
      .exec();
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    if (dto.name || dto.code) {
      const conflict = await this.deptModel.findOne({
        _id: { $ne: id },
        $or: [
          ...(dto.name ? [{ name: dto.name }] : []),
          ...(dto.code ? [{ code: dto.code }] : [])
        ]
      });
      if (conflict) {
        throw new ConflictException('Another department already uses this name or code');
      }
    }

    const updated = await this.deptModel.findByIdAndUpdate(id, dto, { new: true })
      .populate('manager_id', '_id name email')
      .exec();
    if (!updated) throw new NotFoundException('Department not found');
    return updated;
  }

  async remove(id: string) {
    const assignedUsers = await this.userModel.countDocuments({ department_id: id });
    if (assignedUsers > 0) {
      throw new BadRequestException(`Cannot delete department: ${assignedUsers} users are currently assigned to it`);
    }

    const deleted = await this.deptModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Department not found');
    return deleted;
  }
}