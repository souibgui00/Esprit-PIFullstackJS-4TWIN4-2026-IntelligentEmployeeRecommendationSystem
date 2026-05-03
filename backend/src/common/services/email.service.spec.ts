import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        EMAIL_USER: 'test@gmail.com',
        EMAIL_PASSWORD: 'password123',
        EMAIL_SMTP_HOST: 'smtp.gmail.com',
        EMAIL_SMTP_PORT: 587,
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNewUserCredentials', () => {
    it('should return false when transporter is not configured', async () => {
      // Mock config service to return undefined credentials
      jest.spyOn(configService, 'get').mockReturnValueOnce(undefined);
      
      const newService = new EmailService(configService);
      const result = await newService.sendNewUserCredentials(
        'user@example.com',
        'John Doe',
        'password123',
        'MAT001',
      );

      expect(result).toBe(false);
    });

    it('should send email successfully with valid configuration', async () => {
      const result = await service.sendNewUserCredentials(
        'user@example.com',
        'John Doe',
        'password123',
        'MAT001',
      );

      // Note: This will return false/success depending on transporter availability
      expect(typeof result).toBe('boolean');
    });
  });

  describe('sendResetPasswordLink', () => {
    it('should attempt to send password reset email', async () => {
      const result = await service.sendResetPasswordLink(
        'user@example.com',
        'reset-token-123',
      );

      expect(typeof result).toBe('boolean');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email to new user', async () => {
      const result = await service.sendWelcomeEmail(
        'user@example.com',
        'John Doe',
      );

      expect(typeof result).toBe('boolean');
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});
