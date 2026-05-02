import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ScoringService } from './scoring.service';

describe('ScoringService', () => {
  let service: ScoringService;

  const mockUserModel = {
    findById: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      }),
      select: jest.fn().mockResolvedValue(null),
    }),
    findByIdAndUpdate: jest.fn().mockResolvedValue(null),
  };

  const mockActivityModel = {
    findById: jest.fn().mockResolvedValue(null),
  };

  const mockParticipationModel = {
    find: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken('Activity'),
          useValue: mockActivityModel,
        },
        {
          provide: getModelToken('Participation'),
          useValue: mockParticipationModel,
        },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have calculateSkillScore method', () => {
    expect(typeof service.calculateSkillScore).toBe('function');
  });

  it('should have getEmployeeSkillScores method', () => {
    expect(typeof service.getEmployeeSkillScores).toBe('function');
  });

  it('should have calculateGlobalActivityScore method', () => {
    expect(typeof service.calculateGlobalActivityScore).toBe('function');
  });

  it('should have getActivityMatchPercentage method', () => {
    expect(typeof service.getActivityMatchPercentage).toBe('function');
  });

  it('should have updateSkoresAfterParticipation method', () => {
    expect(typeof service.updateSkoresAfterParticipation).toBe('function');
  });

  it('should have getScoreAnalytics method', () => {
    expect(typeof service.getScoreAnalytics).toBe('function');
  });

  it('should have compareEmployeeScores method', () => {
    expect(typeof service.compareEmployeeScores).toBe('function');
  });
});
