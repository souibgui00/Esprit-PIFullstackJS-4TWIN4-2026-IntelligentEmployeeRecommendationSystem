import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Session } from './schema/session.schema';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../common/services/email.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockSessionModel = jest.fn().mockImplementation(() => ({
    save: jest.fn(),
  }));
  (mockSessionModel as any).findOne = jest.fn();
  (mockSessionModel as any).findOneAndUpdate = jest.fn();
  (mockSessionModel as any).updateMany = jest.fn();

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d';
      if (key === 'FRONTEND_URL') return 'http://localhost:5173';
      return undefined;
    }),
  };

  const mockEmailService = {
    sendResetPasswordEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: getModelToken(Session.name), useValue: mockSessionModel },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
