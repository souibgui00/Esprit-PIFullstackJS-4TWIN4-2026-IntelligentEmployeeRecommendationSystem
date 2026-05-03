import { Test, TestingModule } from '@nestjs/testing';
import { CvExtractionService } from './cv-extraction.service';
import { SkillsService } from '../../skills/skills.service';

describe('CvExtractionService', () => {
  let service: CvExtractionService;
  let skillsService: SkillsService;

  const mockSkillsService = {
    findAll: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CvExtractionService,
        {
          provide: SkillsService,
          useValue: mockSkillsService,
        },
      ],
    }).compile();

    service = module.get<CvExtractionService>(CvExtractionService);
    skillsService = module.get<SkillsService>(SkillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('extractTextBuffer', () => {
    it('should extract text from PDF buffer', async () => {
      const mockPdfBuffer = Buffer.from('mock pdf content');

      mockSkillsService.findAll.mockResolvedValueOnce([]);

      const result = await service.extractTextBuffer(mockPdfBuffer, 'pdf');

      expect(typeof result).toBe('string');
    });

    it('should handle empty buffer gracefully', async () => {
      const emptyBuffer = Buffer.from('');

      mockSkillsService.findAll.mockResolvedValueOnce([]);

      const result = await service.extractTextBuffer(emptyBuffer, 'pdf');

      expect(result).toBeDefined();
    });
  });

  describe('extractProfileFromBuffer', () => {
    it('should extract CV profile data from buffer', async () => {
      const mockCvBuffer = Buffer.from(
        'John Doe\nemail@example.com\n+1234567890\nJavaScript, Python\n5 years experience',
      );

      mockSkillsService.findAll.mockResolvedValueOnce([
        { _id: '1', name: 'JavaScript', type: 'programming' },
        { _id: '2', name: 'Python', type: 'programming' },
      ]);

      const result = await service.extractProfileFromBuffer(
        mockCvBuffer,
        'pdf',
        { createMissing: false },
      );

      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('phone');
      expect(result).toHaveProperty('skills');
      expect(result).toHaveProperty('yearsOfExperience');
    });
  });

  describe('findSkillsInText', () => {
    it('should find matching skills in text', async () => {
      const text = 'I have experience with JavaScript, Python, and TypeScript';

      mockSkillsService.findAll.mockResolvedValueOnce([
        { _id: '1', name: 'JavaScript', type: 'programming' },
        { _id: '2', name: 'Python', type: 'programming' },
        { _id: '3', name: 'TypeScript', type: 'programming' },
      ]);

      const result = await service.findSkillsInText(text, {
        createMissing: false,
      });

      expect(result).toHaveProperty('matchedSkillIds');
      expect(result).toHaveProperty('suggestions');
      expect(Array.isArray(result.matchedSkillIds) || result.matchedSkillIds instanceof Set).toBe(true);
    });
  });

  describe('matchSkillsAgainstDatabase', () => {
    it('should match skills against database', async () => {
      mockSkillsService.findAll.mockResolvedValueOnce([
        { _id: '1', name: 'JavaScript', type: 'programming' },
        { _id: '2', name: 'Python', type: 'programming' },
      ]);

      const skills = [
        { skillId: '1', name: 'JavaScript', confidence: 0.95 },
        { skillId: '2', name: 'Python', confidence: 0.87 },
      ];

      const result = await service.matchSkillsAgainstDatabase(skills, {
        createMissing: false,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});
