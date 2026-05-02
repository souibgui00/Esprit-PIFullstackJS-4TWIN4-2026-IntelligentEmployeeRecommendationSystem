import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PrioritizationService } from './prioritization.service';
import { ScoringService } from '../scoring/scoring.service';
import { Types } from 'mongoose';

describe('PrioritizationService', () => {
  let service: PrioritizationService;

  const mockUserModel = {
    find: jest.fn(),
    select: jest.fn().mockReturnThis(),
    lean: jest.fn(),
    db: {
      db: {
        collection: jest.fn().mockReturnValue({
          findOne: jest.fn(),
        }),
      },
    },
  };

  const mockActivityModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockScoringService = {
    calculateGlobalActivityScore: jest.fn(),
    getActivityMatchPercentage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrioritizationService,
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
          useValue: {},
        },
        {
          provide: getModelToken('Skill'),
          useValue: {},
        },
        {
          provide: ScoringService,
          useValue: mockScoringService,
        },
      ],
    }).compile();

    service = module.get<PrioritizationService>(PrioritizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('inferIntent', () => {
    it('should infer development for training', () => {
      expect(service.inferIntent('training')).toBe('development');
    });

    it('should infer balanced for unknown types', () => {
      expect(service.inferIntent('other')).toBe('balanced');
    });
  });

  describe('applyIntentAwareScoring', () => {
    it('should apply development scoring logic', () => {
      const candidates = [
        { name: 'John', skillGaps: [1, 2], globalScore: 30, rank: 'Junior' }
      ];
      const activity = { type: 'training', intent: 'development', level: 'beginner' };

      const result = service.applyIntentAwareScoring(candidates, activity);
      expect(result[0].intent).toBe('development');
      expect(result[0].contextScore).toBeGreaterThan(0);
    });

    it('should apply performance scoring logic', () => {
      const candidates = [
        { name: 'Jane', skillGaps: [], globalScore: 90, matchPercentage: 100, rank: 'Senior' }
      ];
      const activity = { type: 'project', intent: 'performance', level: 'advanced' };

      const result = service.applyIntentAwareScoring(candidates, activity);
      expect(result[0].intent).toBe('performance');
      expect(result[0].contextScore).toBeGreaterThan(50);
    });
  });

  describe('resolveTies', () => {
    it('should sort by contextScore descending', () => {
      const candidates = [
        { name: 'A', contextScore: 50, rank: 'Junior' },
        { name: 'B', contextScore: 80, rank: 'Junior' }
      ];
      const result = service.resolveTies(candidates);
      expect(result[0].name).toBe('B');
    });
  });
});
