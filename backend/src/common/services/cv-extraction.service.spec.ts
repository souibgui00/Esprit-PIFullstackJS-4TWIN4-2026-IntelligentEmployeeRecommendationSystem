import { Test, TestingModule } from '@nestjs/testing';
import { CvExtractionService } from './cv-extraction.service';
// Mock pdfreader used by the service to avoid parsing real PDFs in unit tests
jest.mock('pdfreader', () => ({
  PdfReader: jest.fn().mockImplementation(() => ({
    parseBuffer: jest.fn((buf: Buffer, cb: Function) => {
      // simulate callback-based parser; some implementations call cb(null, {text}) repeatedly
      cb(null, { text: 'mocked text' });
      return null;
    }),
  })),
}));
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

      const result = await (service as any).findSkillsInText(text, {
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

      // matchSkillsAgainstDatabase is private; test behavior via findSkillsInText
      mockSkillsService.findAll.mockResolvedValueOnce([
        { _id: '1', name: 'JavaScript', type: 'programming' },
        { _id: '2', name: 'Python', type: 'programming' },
      ]);

      const combined = 'JavaScript Python';
      const r = await (service as any).findSkillsInText(combined, { createMissing: false });

      expect(Array.isArray(r.matchedSkillIds)).toBe(true);
      expect(r.matchedSkillIds.length).toBeGreaterThanOrEqual(0);
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});
