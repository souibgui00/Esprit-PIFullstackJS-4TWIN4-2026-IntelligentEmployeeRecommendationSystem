import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schema/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { EmailService } from '../common/services/email.service';


@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private emailService: EmailService,
  ) { }

  async create(data: any) {
    // Always generate matricule
    const randomId = Math.floor(1000 + Math.random() * 9000);
    data.matricule = `EMP-${new Date().getFullYear()}-${randomId}`;

    // Always generate password
    const rawPassword = Math.random().toString(36).slice(-10);
    console.log(`Generated password for ${data.email}: ${rawPassword}`); // Temporary logging

    const salt = await bcrypt.genSalt(10);
    data.password = await bcrypt.hash(rawPassword, salt);

    // Set role to enum if provided as string
    if (typeof data.role === 'string') {
      data.role = data.role.toUpperCase() as Role;
    }

    // Clean up empty optional fields that might fail MongoId casting
    if (data.department_id === "" || data.department_id === "none") data.department_id = null;
    if (data.manager_id === "" || data.manager_id === "none") data.manager_id = null;

    const user = new this.userModel(data);
    const savedUser = await user.save();

    // Send email with credentials to the new user (non-blocking)
    // Log the generated password so admin can manually share if email fails
    console.log(`[UsersService] Email credentials for ${data.email}: Password: ${rawPassword}`);
    this.emailService.sendNewUserCredentials(
      data.email,
      data.name,
      rawPassword,
      data.matricule,
    ).catch(err => {
      console.error('[UsersService] Failed to send credentials email:', err);
      // Still log the credentials in case email service fails completely
      console.warn(`[UsersService] FALLBACK: Share credentials manually - Email: ${data.email}, Password: ${rawPassword}, Matricule: ${data.matricule}`);
    });

    // Return user without password but with the raw password included
    const userObj = savedUser.toObject();
    const { password, ...userWithoutPassword } = userObj as any;
    return {
      ...userWithoutPassword,
      generatedPassword: rawPassword,
    };
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    });
  }

  async findAll() {
    try {
      return await this.userModel.find().populate('department_id').select('-password');
    } catch (error: any) {
      console.warn('[UsersService] Population failed in findAll, falling back to unpopulated users:', error.message);
      return this.userModel.find().select('-password');
    }
  }

  async findOne(id: string) {
    try {
      return await this.userModel.findById(id).populate('department_id');
    } catch (error: any) {
      console.warn(`[UsersService] Population failed for user ${id}:`, error.message);
      return this.userModel.findById(id);
    }
  }

  async update(id: string, data: UpdateUserDto) {
    // Clean up empty optional fields
    const updateData: any = { ...data };
    if (updateData.department_id === "" || updateData.department_id === "none") updateData.department_id = null;
    if (updateData.manager_id === "" || updateData.manager_id === "none") updateData.manager_id = null;

    try {
      return await this.userModel.findByIdAndUpdate(id, updateData, { new: true }).populate('department_id');
    } catch (error: any) {
      console.warn(`[UsersService] Update population failed for user ${id}:`, error.message);
      return this.userModel.findByIdAndUpdate(id, updateData, { new: true });
    }
  }

  async remove(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }
}
