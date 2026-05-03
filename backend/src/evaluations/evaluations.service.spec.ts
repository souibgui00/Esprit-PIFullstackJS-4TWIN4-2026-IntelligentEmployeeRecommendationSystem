import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { EvaluationsService } from './evaluations.service';
import { Evaluation } from './schema/evaluation.schema';
import { UsersService } from '../users/users.service';

describe('EvaluationsService', () => {
  let service: EvaluationsService;

  const mockEvaluationModel: any = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  }));

  mockEvaluationModel.find = jest.fn();
  mockEvaluationModel.findById = jest.fn();
  mockEvaluationModel.findByIdAndUpdate = jest.fn();
  mockEvaluationModel.findByIdAndDelete = jest.fn();

  const mockUsersService = {
    updateUserSkill: jest.fn(),
    addSkillToUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationsService,
        {
          provide: getModelToken(Evaluation.name),
          useValue: mockEvaluationModel,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<EvaluationsService>(EvaluationsService);
  });

  it('should auto-approve a saved approved evaluation', async () => {
    const evaluationId = new Types.ObjectId();
    const approveSpy = jest.spyOn(service, 'approve').mockResolvedValue();

    mockEvaluationModel.mockImplementation((data) => ({
      ...data,
      _id: evaluationId,
      save: jest.fn().mockResolvedValue({
        _id: evaluationId,
        status: 'approved',
      }),
    }));

    const result = await service.create({ status: 'approved' });

    expect(result.status).toBe('approved');
    expect(approveSpy).toHaveBeenCalledWith(evaluationId.toString());
  });

  it('should update existing user skills during approval', async () => {
    const employeeId = new Types.ObjectId();
    const skillId = new Types.ObjectId();

    mockEvaluationModel.findById.mockResolvedValue({
      _id: new Types.ObjectId(),
      employeeId,
      skillEvaluations: [
        { skillId, newScore: 4, newLevel: 'intermediate' },
      ],
    });

    await service.approve(new Types.ObjectId().toHexString());

    expect(mockUsersService.updateUserSkill).toHaveBeenCalledWith(
      employeeId.toString(),
      skillId.toString(),
      {
        level: 'intermediate',
        hierarchie_eval: 4,
        etat: 'validated',
      },
    );
    expect(mockUsersService.addSkillToUser).not.toHaveBeenCalled();
  });

  it('should add the skill when approval cannot update an existing one', async () => {
    const employeeId = new Types.ObjectId();
    const skillId = new Types.ObjectId();

    mockEvaluationModel.findById.mockResolvedValue({
      _id: new Types.ObjectId(),
      employeeId,
      skillEvaluations: [
        { skillId, newScore: 8, newLevel: 'advanced' },
      ],
    });
    mockUsersService.updateUserSkill.mockRejectedValue(new Error('missing skill'));

    await service.approve(new Types.ObjectId().toHexString());

    expect(mockUsersService.addSkillToUser).toHaveBeenCalledWith(
      employeeId.toString(),
      {
        skillId: skillId.toString(),
        level: 'advanced',
        auto_eval: 0,
        hierarchie_eval: 4,
        etat: 'validated',
      },
    );
  });
});