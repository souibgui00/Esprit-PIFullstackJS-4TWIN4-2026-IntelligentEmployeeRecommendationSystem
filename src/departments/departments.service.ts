import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department } from './schema/department.schema';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(@InjectModel(Department.name) private deptModel: Model<Department>) {}

  async create(dto: CreateDepartmentDto) {
    const exist = await this.deptModel.findOne({ $or: [{ name: dto.name }, { code: dto.code }] });
    if (exist) throw new ConflictException('Department with this name or code already exists');
    return this.deptModel.create(dto);
  }

  async findAll() {
    return this.deptModel.find().populate('manager_id', 'name email').exec();
  }

  async findOne(id: string) {
    const dept = await this.deptModel.findById(id).populate('manager_id', 'name email').exec();
    if (!dept) throw new NotFoundException('Department not found');
    return dept;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const updated = await this.deptModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Department not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.deptModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Department not found');
    return deleted;
  }
}