import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { Session } from './schema/session.schema';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        @InjectModel(Session.name)
        private sessionModel: Model<Session>,
    ) { }

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
        console.log('[AuthService] Login attempt - User:', { email: user.email, role: user.role, _id: user._id });
        
        const payload = { email: user.email, sub: user._id, role: user.role };
        const accessToken = this.jwtService.sign(payload);
        
        console.log('[AuthService] JWT payload created:', payload);
        
        // Generate refresh token (longer expiry)
        const refreshTokenExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
        const refreshToken = this.jwtService.sign(payload, { expiresIn: refreshTokenExpiry as any });

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
            },
        };
    }

    private getExpirationMs(expiresIn: string): number {
        const match = expiresIn.match(/(\d+)([smhd])/);
        if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days

        const [, value, unit] = match;
        const num = parseInt(value, 10);

        switch (unit) {
            case 's': return num * 1000;
            case 'm': return num * 60 * 1000;
            case 'h': return num * 60 * 60 * 1000;
            case 'd': return num * 24 * 60 * 60 * 1000;
            default: return 7 * 24 * 60 * 60 * 1000;
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
}

