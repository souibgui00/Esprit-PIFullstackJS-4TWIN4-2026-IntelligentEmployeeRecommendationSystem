import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access token on successful login', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser: any = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        matricule: 'EMP-001',
        telephone: '+1234567890',
        date_embauche: new Date(),
        department_id: null,
        manager_id: null,
        status: 'active',
        en_ligne: false,
        avatar: null,
        position: null,
        jobDescription: null,
        yearsOfExperience: 0,
        location: null,
        isGoogleUser: false,
        facePicture: null,
        isFaceIdEnabled: false,
        cvUrl: null,
        resetPasswordToken: null,
        skills: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedResult: any = {
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-refresh-token',
        expiresIn: 3600,
        user: mockUser,
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'login').mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });
  });

  describe('register', () => {
    it('should create new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
        matricule: 'EMP-001',
        telephone: '+1234567890',
        department_id: 'dept-001',
      };

      const expectedResult: any = {
        access_token: 'new-jwt-token',
        refresh_token: 'new-refresh-token',
        expiresIn: 3600,
        user: {
          id: '2',
          email: 'newuser@example.com',
          name: 'New User',
          role: 'EMPLOYEE',
          matricule: 'EMP-002',
          telephone: '+1234567891',
          date_embauche: new Date(),
          department_id: null,
          manager_id: null,
          status: 'active',
          en_ligne: false,
          avatar: null,
          position: null,
          jobDescription: null,
          yearsOfExperience: 0,
          location: null,
          isGoogleUser: false,
          facePicture: null,
          isFaceIdEnabled: false,
          cvUrl: null,
          resetPasswordToken: null,
          skills: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      jest.spyOn(authService, 'register').mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResult);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should throw BadRequestException for duplicate email', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      jest.spyOn(authService, 'register').mockRejectedValue(
        new BadRequestException('Email already exists')
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('refresh', () => {
    it('should refresh access token successfully', async () => {
      const refreshTokenBody = { refreshToken: 'refresh-token' };
      const expectedResult = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expiresIn: 3600,
      };

      jest.spyOn(authService, 'refresh').mockResolvedValue(expectedResult);

      const result = await controller.refresh(refreshTokenBody);

      expect(result).toEqual(expectedResult);
      expect(authService.refresh).toHaveBeenCalledWith(refreshTokenBody.refreshToken);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshTokenBody = { refreshToken: 'invalid-token' };

      jest.spyOn(authService, 'refresh').mockRejectedValue(
        new UnauthorizedException('Invalid refresh token')
      );

      await expect(controller.refresh(refreshTokenBody)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const refreshTokenBody = { refreshToken: 'valid-refresh-token' };
      const expectedResult = { message: 'Logout successful' };

      jest.spyOn(authService, 'logout').mockResolvedValue(expectedResult);

      const result = await controller.logout(refreshTokenBody);

      expect(result).toEqual(expectedResult);
      expect(authService.logout).toHaveBeenCalledWith(refreshTokenBody.refreshToken);
    });
  });
});
