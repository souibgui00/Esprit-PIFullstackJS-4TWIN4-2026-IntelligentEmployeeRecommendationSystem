import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { Session } from './schema/session.schema';
import { EmailService } from '../common/services/email.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    @InjectModel(Session.name)
    private sessionModel: Model<Session>,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(pass, user.password);
    if (isMatch) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    console.log('[AuthService] Login attempt - User:', {
      email: user.email,
      role: user.role,
      _id: user._id,
    });

    const payload = { email: user.email, sub: user._id, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    console.log('[AuthService] JWT payload created:', payload);

    // Generate refresh token (longer expiry)
    const refreshTokenExpiry =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiry as any,
    });

    // Calculate expiration date
    const expirationMs = this.getExpirationMs(refreshTokenExpiry);
    const expiresAt = new Date(Date.now() + expirationMs);

    // Save session to database
    const session = new this.sessionModel({
      userId: user._id,
      refreshToken,
      expiresAt,
      isRevoked: false,
    });
    await session.save();

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        matricule: user.matricule,
        telephone: user.telephone,
        date_embauche: user.date_embauche,
        department_id: user.department_id,
        manager_id: user.manager_id,
        status: user.status,
        en_ligne: user.en_ligne,
        cvUrl: user.cvUrl,
        avatar: user.avatar,
        skills: user.skills,
        position: user.position,
        jobDescription: user.jobDescription,
        yearsOfExperience: user.yearsOfExperience,
        location: user.location,
        isFaceIdEnabled: user.isFaceIdEnabled,
      },
    };
  }

  private getExpirationMs(expiresIn: string): number {
    const match = expiresIn.match(/(\d+)([smhd])/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 's':
        return num * 1000;
      case 'm':
        return num * 60 * 1000;
      case 'h':
        return num * 60 * 60 * 1000;
      case 'd':
        return num * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

  async refresh(refreshToken: string) {
    try {
      // Verify token validity
      const payload = this.jwtService.verify(refreshToken);

      // Check if session exists and is not revoked
      const session = await this.sessionModel.findOne({
        refreshToken,
        userId: payload.sub,
        isRevoked: false,
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Get user
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new access token
      const newPayload = { email: user.email, sub: user._id, role: user.role };
      const newAccessToken = this.jwtService.sign(newPayload);

      return {
        access_token: newAccessToken,
        refresh_token: refreshToken,
        expiresIn: 900,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    const session = await this.sessionModel.findOneAndUpdate(
      { refreshToken },
      { isRevoked: true },
      { new: true },
    );

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.sessionModel.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true },
    );

    return { message: 'Logged out from all devices' };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Self-registration should never allow privileged role assignment.
    const user = await this.usersService.create({
      ...registerDto,
      role: 'EMPLOYEE',
      status: 'active',
    });
    return this.login(user);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // We don't want to leak if the email exists, but we can't send an email either.
      // For UX, we say "If the account exists, an email was sent" but internally we just return.
      return {
        message:
          'If an account with that email exists, an email has been sent.',
      };
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await this.usersService.saveResetToken(user._id.toString(), token, expires);

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await this.emailService.sendResetPasswordEmail(
      user.email,
      user.name,
      resetLink,
    );

    return { message: 'Password reset email sent successfully.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);
    if (!user) {
      throw new UnauthorizedException(
        'Password reset token is invalid or has expired.',
      );
    }

    await this.usersService.updatePassword(user._id.toString(), newPassword);

    return { message: 'Password has been reset successfully.' };
  }

  async faceLogin(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // For this demo, we assume the frontend already verified the face.
    // In a production app, we would use a signed challenge here.
    if (!user.isFaceIdEnabled) {
      throw new UnauthorizedException(
        'Face ID is not enabled for this account',
      );
    }

    return this.login(user);
  }
}
