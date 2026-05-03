import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ParticipationsService } from './participations.service';
import { Participation } from './schema/participation.schema';
import { ActivitiesService } from '../activities/activities.service';
import { UsersService } from '../users/users.service';
import { ScoringService } from '../scoring/scoring.service';
import { SkillsService } from '../skills/skills.service';
import { EvaluationsService } from '../evaluations/evaluations.service';

describe('ParticipationsService', () => {
  let service: ParticipationsService;

  const mockParticipationModel: any = jest.fn();
  mockParticipationModel.findOne = jest.fn();
  mockParticipationModel.find = jest.fn();
  mockParticipationModel.findOneAndUpdate = jest.fn();
  mockParticipationModel.findByIdAndUpdate = jest.fn();
  mockParticipationModel.findById = jest.fn();
  mockParticipationModel.deleteOne = jest.fn();

  const mockActivitiesService = {
    enroll: jest.fn(),
    unenroll: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
    findRawDepartmentId: jest.fn(),
    findDepartmentManager: jest.fn(),
    findManagedEmployeeIds: jest.fn(),
  };

  const mockScoringService = {
    updateSkoresAfterParticipation: jest.fn(),
  };

  const mockSkillsService = {};
  const mockEvaluationsService = {};

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipationsService,
        {
          provide: getModelToken(Participation.name),
          useValue: mockParticipationModel,
        },
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ScoringService,
          useValue: mockScoringService,
        },
        {
          provide: SkillsService,
          useValue: mockSkillsService,
        },
        {
          provide: EvaluationsService,
          useValue: mockEvaluationsService,
        },
      ],
    }).compile();

    service = module.get<ParticipationsService>(ParticipationsService);
  });

  it('should return an existing participation when one already exists', async () => {
    const existingParticipation = { _id: new Types.ObjectId() };
    mockParticipationModel.findOne.mockResolvedValue(existingParticipation);

    const result = await service.create(
      new Types.ObjectId().toHexString(),
      new Types.ObjectId().toHexString(),
    );

    expect(result).toBe(existingParticipation);
    expect(mockActivitiesService.enroll).not.toHaveBeenCalled();
  });

  it('should roll back activity enrollment if participation save fails', async () => {
    const userId = new Types.ObjectId().toHexString();
    const activityId = new Types.ObjectId().toHexString();

    mockParticipationModel.findOne.mockResolvedValue(null);
    mockActivitiesService.enroll.mockResolvedValue({});
    mockParticipationModel.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(new Error('save failed')),
    }));
    mockActivitiesService.unenroll.mockResolvedValue({});

    await expect(service.create(userId, activityId)).rejects.toThrow('save failed');
    expect(mockActivitiesService.unenroll).toHaveBeenCalledWith(activityId);
  });

  it('should update scores when a participation is completed', async () => {
    const userId = new Types.ObjectId().toHexString();
    const activityId = new Types.ObjectId().toHexString();
    const oldParticipation = { status: 'in_progress', feedback: 2 };
    const updatedParticipation = {
      status: 'completed',
      progress: 100,
      feedback: 4,
      toObject: jest.fn().mockReturnValue({
        _id: new Types.ObjectId(),
        userId,
        activityId,
        status: 'completed',
        progress: 100,
        feedback: 4,
      }),
    };

    mockParticipationModel.findOne.mockResolvedValue(oldParticipation);
    mockParticipationModel.findOneAndUpdate.mockResolvedValue(updatedParticipation);
    mockScoringService.updateSkoresAfterParticipation.mockResolvedValue(undefined);

    const result = await service.updateProgress(userId, activityId, 100, 4);

    expect(result.scoreUpdated).toBe(true);
    expect(result.appliedFeedback).toBe(4);
    expect(mockScoringService.updateSkoresAfterParticipation).toHaveBeenCalledWith(
      userId,
      activityId,
      80,
    );
  });
});