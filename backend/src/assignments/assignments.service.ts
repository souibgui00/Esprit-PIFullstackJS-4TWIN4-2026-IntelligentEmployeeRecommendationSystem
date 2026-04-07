import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment } from './schema/assignment.schema';

import { ActivitiesService } from '../activities/activities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { ParticipationsService } from '../participations/participations.service';
import { ForwardToManagerDto } from './dto/forward-to-manager.dto';
import { ForwardToDepartmentManagerDto } from './dto/forward-to-department-manager.dto';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AssignmentsService {
    private readonly logger = new Logger(AssignmentsService.name);

    constructor(
        @InjectModel(Assignment.name) private assignmentModel: Model<Assignment>,
        private activitiesService: ActivitiesService,
        private notificationsService: NotificationsService,
        private usersService: UsersService,
        private notificationsGateway: NotificationsGateway,
        private participationsService: ParticipationsService,
    ) { }

    async create(userId: string, activityId: string, assignedBy: string): Promise<Assignment> {
        const activity = await this.activitiesService.findOne(activityId);
        if (!activity) {
            throw new NotFoundException(`Activity with ID ${activityId} not found`);
        }
        if (activity.workflowStatus !== 'approved') {
            throw new BadRequestException('Cannot assign an unapproved activity');
        }

        const existing = await this.assignmentModel.findOne({
            userId: new Types.ObjectId(userId),
            activityId: new Types.ObjectId(activityId)
        });
        if (existing) return existing;

        const assignment = new this.assignmentModel({
            userId: new Types.ObjectId(userId),
            activityId: new Types.ObjectId(activityId),
            assignedBy: new Types.ObjectId(assignedBy),
        });
        return await assignment.save();
    }

    async forwardToManager(forwardDto: ForwardToManagerDto, requesterId: string): Promise<any> {
        const { candidateIds, activityId, managerId, aiScore, skillGaps, reason } = forwardDto;
        const uniqueCandidateIds = [...new Set(candidateIds)];

        // Validate activity exists
        const activity = await this.activitiesService.findOne(activityId);
        if (!activity) {
            throw new NotFoundException(`Activity with ID ${activityId} not found`);
        }
        if (activity.workflowStatus !== 'approved') {
            throw new BadRequestException('Cannot recommend candidates for unapproved activity');
        }

        // Validate manager exists and has MANAGER role
        const manager = await this.usersService.findOne(managerId);
        if (!manager) {
            throw new NotFoundException(`Manager with ID ${managerId} not found`);
        }
        this.logger.debug(`[ForwardToManager] Manager target managerId=${managerId} role=${manager?.role}`);
        if (manager.role !== Role.MANAGER) {
            this.logger.warn(`[ForwardToManager] Invalid manager role role=${manager.role} managerId=${managerId}`);
            throw new BadRequestException('Target user must be a manager');
        }

        // Create assignments for each candidate (Optimize: fetch existing in one query)
        const candidateObjectIds = uniqueCandidateIds.map(id => new Types.ObjectId(id));
        const activityObjectId = new Types.ObjectId(activityId);
        const managerObjectId = new Types.ObjectId(managerId);

        const existingAssignments = await this.assignmentModel.find({
            userId: { $in: candidateObjectIds },
            activityId: activityObjectId,
            managerId: managerObjectId
        }).select('userId');

        const existingCandidateIdsSet = new Set(existingAssignments.map(a => a.userId.toString()));

        const createdAssignments: Assignment[] = [];
        for (const candidateId of uniqueCandidateIds) {
            if (existingCandidateIdsSet.has(candidateId)) {
                continue;
            }

            const assignment = new this.assignmentModel({
                userId: new Types.ObjectId(candidateId),
                activityId: activityObjectId,
                assignedBy: new Types.ObjectId(requesterId),
                managerId: managerObjectId,
                type: 'recommendation',
                recommendedBy: new Types.ObjectId(requesterId),
                metadata: {
                    aiScore,
                    skillGaps: skillGaps || [],
                    reason: reason || 'Recommended by system analysis'
                }
            });
            const saved = await assignment.save();
            createdAssignments.push(saved);
        }

        // Create notification for manager
        const candidateCount = createdAssignments.length;
        if (candidateCount > 0) {
            const createdCandidateIds = createdAssignments.map(a => a.userId.toString());
            const notification = await this.notificationsService.create({
                recipientId: managerId,
                title: 'New Skill Recommendations',
                message: `You have ${candidateCount} recommended candidate(s) for "${activity.title}"`,
                type: 'recommendations_received',
                metadata: {
                    activityId: activityId,
                    candidateIds: createdCandidateIds,
                    assignmentCount: candidateCount,
                    recommendedBy: requesterId,
                    aiScore: aiScore ?? null,
                    skillGaps: skillGaps || [],
                    reason: reason || 'Recommended by system analysis',
                }
            }, { emitRealtime: false });

            const notificationData = {
                id: notification._id?.toString?.() ?? undefined,
                recipientId: managerId,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                activityId,
                candidateIds: createdCandidateIds,
                aiScore: aiScore ?? null,
                metadata: notification.metadata,
            };

            const emitted = this.notificationsGateway.emitToUser(managerId, 'newNotification', notificationData);
            this.logger.log(
                `[ForwardToManager] Gateway emit newNotification managerId=${managerId} emitted=${emitted} candidates=${createdCandidateIds.length}`,
            );
        }

        return {
            success: true,
            assignmentsCreated: createdAssignments.length,
            assignments: createdAssignments,
            notificationSent: candidateCount > 0
        };
    }

    async forwardToDepartmentManagers(forwardDto: ForwardToDepartmentManagerDto, requesterId: string): Promise<any> {
        const { candidateIds, activityId, aiScore, skillGaps, reason } = forwardDto;
        const uniqueCandidateIds = [...new Set(candidateIds || [])];

        this.logger.debug(
            `[ForwardToDepartmentManagers] START requesterId=${requesterId} activityId=${activityId} candidateIdsCount=${candidateIds?.length || 0} uniqueCandidateIdsCount=${uniqueCandidateIds.length}`,
        );

        if (!activityId) {
            throw new BadRequestException('activityId is required');
        }
        if (!uniqueCandidateIds.length) {
            throw new BadRequestException('candidateIds must contain at least one employee');
        }

        const activity = await this.activitiesService.findOne(activityId);
        if (!activity) {
            throw new NotFoundException(`Activity with ID ${activityId} not found`);
        }
        if (activity.workflowStatus !== 'approved') {
            throw new BadRequestException('Cannot recommend candidates for unapproved activity');
        }

        const candidateToManager = new Map<string, string>();
        const skippedCandidates: Array<{ candidateId: string; reason: string }> = [];
        const skippedBreakdown = {
            candidateNotFound: 0,
            invalidDepartmentId: 0,
            managerNotFoundOrInvalidRole: 0,
            assignmentAlreadyExists: 0,
        };

        for (const candidateId of uniqueCandidateIds) {
            this.logger.debug(`[ForwardToDepartmentManagers] Employee treated candidateId=${candidateId}`);

            let candidate: any;
            try {
                candidate = await this.usersService.findOne(candidateId);
            } catch {
                skippedCandidates.push({ candidateId, reason: 'Candidate not found' });
                skippedBreakdown.candidateNotFound += 1;
                this.logger.warn(`[ForwardToDepartmentManagers] Skipped: candidate not found candidateId=${candidateId}`);
                continue;
            }

            // Use a raw lean query to get department_id – NOT the populated value from findOne.
            // Mongoose silently returns null for department_id when populate can't resolve
            // the referenced document, even if the raw ObjectId is stored correctly.
            const departmentId = await this.usersService.findRawDepartmentId(candidateId);

            this.logger.debug(
                `[ForwardToDepartmentManagers] Candidate: "${candidate.name}" (${candidateId}) → departmentId=${departmentId}`,
            );

            if (!departmentId || !Types.ObjectId.isValid(departmentId)) {
                skippedCandidates.push({ candidateId, reason: `"${candidate.name}" has no department assigned` });
                skippedBreakdown.invalidDepartmentId += 1;
                this.logger.warn(`[ForwardToDepartmentManagers] Skipped: no valid departmentId for candidateId=${candidateId}`);
                continue;
            }

            const manager = await this.usersService.getManagerByDepartment(departmentId);
            if (!manager) {
                skippedCandidates.push({ candidateId, reason: `No manager found for "${candidate.name}"'s department (deptId: ${departmentId})` });
                skippedBreakdown.managerNotFoundOrInvalidRole += 1;
                this.logger.warn(`[ForwardToDepartmentManagers] Skipped: no manager for departmentId=${departmentId}`);
                continue;
            }

            if (manager.role?.toUpperCase() !== Role.MANAGER) {
                skippedCandidates.push({ candidateId, reason: `Found ${manager.name} but role is "${manager.role}", not MANAGER` });
                skippedBreakdown.managerNotFoundOrInvalidRole += 1;
                this.logger.warn(`[ForwardToDepartmentManagers] Skipped: role mismatch role=${manager.role}`);
                continue;
            }

            const managerId = String(manager._id || '');
            if (!managerId || managerId === 'undefined') {
                skippedCandidates.push({ candidateId, reason: 'Manager _id is invalid' });
                skippedBreakdown.managerNotFoundOrInvalidRole += 1;
                continue;
            }

            this.logger.log(`[ForwardToDepartmentManagers] Linked "${candidate.name}" → Manager "${manager.name}" (${managerId})`);
            candidateToManager.set(candidateId, managerId);
        }

        const activityObjectId = new Types.ObjectId(activityId);
        const managerIds = [...new Set([...candidateToManager.values()])];
        const managerObjectIds = managerIds.map((id) => new Types.ObjectId(id));
        const candidateObjectIds = [...candidateToManager.keys()].map((id) => new Types.ObjectId(id));

        const existingAssignments = managerIds.length
            ? await this.assignmentModel.find({
                userId: { $in: candidateObjectIds },
                activityId: activityObjectId,
                managerId: { $in: managerObjectIds },
                type: 'recommendation',
            }).select('userId managerId status')
            : [];

        const existingPairSet = new Set(
            existingAssignments.map((a) => `${a.userId.toString()}::${a.managerId?.toString?.() || ''}`),
        );

        this.logger.debug(
            `[ForwardToDepartmentManagers] Dedup snapshot existingAssignmentsCount=${existingAssignments.length} dedupPairsCount=${existingPairSet.size}`,
        );

        const createdAssignments: Assignment[] = [];

        for (const [candidateId, managerId] of candidateToManager.entries()) {
            const pairKey = `${candidateId}::${managerId}`;
            if (existingPairSet.has(pairKey)) {
                const existing = existingAssignments.find(a => `${a.userId.toString()}::${a.managerId?.toString?.() || ''}` === pairKey);
                skippedBreakdown.assignmentAlreadyExists += 1;
                skippedCandidates.push({ candidateId, reason: `Recommendation already exists (Status: ${existing?.status || 'Active'})` });
                this.logger.debug(
                    `[ForwardToDepartmentManagers] Duplicate assignment filtered candidateId=${candidateId} managerId=${managerId} pairKey=${pairKey}`,
                );
                continue;
            }

            const assignment = new this.assignmentModel({
                userId: new Types.ObjectId(candidateId),
                activityId: activityObjectId,
                assignedBy: new Types.ObjectId(requesterId),
                managerId: new Types.ObjectId(managerId),
                status: 'pending_manager',
                type: 'recommendation',
                recommendedBy: new Types.ObjectId(requesterId),
                metadata: {
                    aiScore,
                    skillGaps: skillGaps || [],
                    reason: reason || 'Recommended by department-based routing',
                },
            });

            const saved = await assignment.save();
            createdAssignments.push(saved);

            this.logger.log(
                `[ForwardToDepartmentManagers] Assignment created assignmentId=${saved._id?.toString?.()} candidateId=${candidateId} managerId=${managerId} type=recommendation`,
            );

            const singleCandidateIds = [candidateId];
            const notification = await this.notificationsService.create({
                recipientId: managerId,
                title: 'New Skill Recommendations',
                message: `Action Required: New recommendation for "${activity.title}". Please validate the candidate list.`,
                type: 'recommendations_received',
                metadata: {
                    activityId,
                    candidateIds: singleCandidateIds,
                    assignmentCount: 1,
                    recommendedBy: requesterId,
                    aiScore: aiScore ?? null,
                },
            }, { emitRealtime: false });

            const notificationPayload = {
                id: notification._id?.toString?.() ?? undefined,
                title: 'New Skill Recommendations',
                activityId,
                candidateIds: singleCandidateIds,
                aiScore: aiScore ?? null,
                metadata: notification.metadata,
                url: `/manager/recommendations`
            };

            const emitted = this.notificationsGateway.emitToUser(managerId, 'newNotification', notificationPayload);
            this.logger.log(
                `[ForwardToDepartmentManagers] Notification emitted managerId=${managerId} event=newNotification emitted=${emitted} notificationId=${notificationPayload.id || ''} candidateId=${candidateId}`,
            );
        }

        const totalForwarded = createdAssignments.length;
        const skipped = skippedBreakdown.candidateNotFound
            + skippedBreakdown.invalidDepartmentId
            + skippedBreakdown.managerNotFoundOrInvalidRole
            + skippedBreakdown.assignmentAlreadyExists;

        this.logger.debug(
            `[ForwardToDepartmentManagers] END totalForwarded=${totalForwarded} skipped=${skipped} breakdown=${JSON.stringify(skippedBreakdown)} detailsCount=${skippedCandidates.length}`,
        );

        return {
            totalForwarded,
            skipped,
            skippedBreakdown,
            skippedDetails: skippedCandidates,
        };
    }

    async forwardToDepartmentManager(forwardDto: ForwardToDepartmentManagerDto, requesterId: string): Promise<any> {
        return this.forwardToDepartmentManagers(forwardDto, requesterId);
    }

    async findAll(): Promise<Assignment[]> {
        return this.assignmentModel.find()
            .populate('userId', '-password')
            .populate('activityId')
            .populate('assignedBy', '-password')
            .populate('managerId', '-password')
            .exec();
    }

    async findByRecipient(userId: string): Promise<Assignment[]> {
        return this.assignmentModel.find({ userId: new Types.ObjectId(userId) })
            .populate('activityId')
            .populate('assignedBy', '-password')
            .populate('managerId', '-password')
            .exec();
    }

    async findByAssigner(assignedBy: string): Promise<Assignment[]> {
        return this.assignmentModel.find({ assignedBy: new Types.ObjectId(assignedBy) })
            .populate('userId', '-password')
            .populate('activityId')
            .exec();
    }

    async findRecommendationsForManager(managerId: string): Promise<Assignment[]> {
        return this.assignmentModel.find({
            managerId: new Types.ObjectId(managerId),
            type: 'recommendation'
        })
            .populate('userId', '-password')
            .populate('activityId')
            .populate('recommendedBy', '-password')
            .exec();
    }

    async updateStatus(
        id: string,
        status: 'accepted' | 'rejected',
        managerUserId: string,
    ): Promise<Assignment> {
        const assignment = await this.assignmentModel
            .findById(id)
            .populate('activityId')
            .populate('userId', '-password')
            .populate('managerId', '-password');

        if (!assignment) {
            throw new NotFoundException('Assignment not found');
        }

        const assignmentManagerId = String((assignment.managerId as any)?._id || assignment.managerId || '');
        const requesterManagerId = String(managerUserId || '');

        if (!assignmentManagerId || assignmentManagerId !== requesterManagerId) {
            this.logger.warn(
                `[UpdateStatus] Forbidden update attempt assignmentId=${id} requester=${requesterManagerId} owner=${assignmentManagerId}`,
            );
            throw new ForbiddenException('You can only update assignments assigned to you');
        }

        assignment.status = status;
        assignment.reason = null;
        const savedAssignment = await assignment.save();

        const candidateId = String((assignment.userId as any)?._id || assignment.userId || '');
        const activityTitle = (assignment.activityId as any)?.title || 'Activity';
        const activityId = String((assignment.activityId as any)?._id || assignment.activityId || '');

        if (!candidateId) {
            return savedAssignment;
        }

        if (status !== 'accepted') {
            this.logger.log(
                `[UpdateStatus] status=${status} assignmentId=${id} managerId=${requesterManagerId} candidateId=${candidateId} emitted=false`,
            );
            return savedAssignment;
        }

        // IMPORTANT MODIFICATION: 
        // When manager accepts, we don't finalize the assignment yet.
        // We move it to 'notified' status so the employee can then Choice (Accept/Reject).
        assignment.status = 'notified';
        await assignment.save();

        const managerName = (assignment.managerId as any)?.name || 'Your Manager';
        const message = `Manager ${managerName} has recommended the activity "${activityTitle}" for you. Click to view details and join.`;

        try {
            const notification = await this.notificationsService.create({
                recipientId: candidateId,
                title: 'Training Opportunity Identified',
                message,
                type: 'recommendation_accepted',
                metadata: {
                    activityId,
                    assignmentId: id,
                    managerId: requesterManagerId
                },
            }, { emitRealtime: false });

            const payload = {
                id: notification._id?.toString?.() ?? undefined,
                recipientId: candidateId,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                metadata: notification.metadata,
                read: false,
            };

            const emitted = this.notificationsGateway.emitToUser(candidateId, 'newNotification', payload);

            this.logger.log(
                `[UpdateStatus] status=${status} assignmentId=${id} managerId=${requesterManagerId} candidateId=${candidateId} emitted=${emitted}`,
            );
        } catch (err: any) {
            this.logger.error(`[UpdateStatus] Failed to notify candidate assignmentId=${id}: ${err?.message || err}`);
        }

        return savedAssignment;
    }

    async remove(id: string): Promise<void> {
        await this.assignmentModel.findByIdAndDelete(id).exec();
    }

    async employeeAccept(id: string, employeeId: string): Promise<Assignment> {
        const assignment = await this.assignmentModel.findById(id)
            .populate('activityId');
        if (!assignment) throw new NotFoundException('Assignment not found');

        if (assignment.userId.toString() !== employeeId) {
            throw new ForbiddenException('You can only accept assignments meant for you');
        }

        if (assignment.status !== 'accepted') {
            assignment.status = 'accepted';
            await assignment.save();
        }

        const activityIdString = String((assignment.activityId as any)?._id || assignment.activityId);

        // Create a real Participation record for the employee.
        // participationsService.create() creates the DB record AND increments the seat counter.
        try {
            await this.participationsService.create(employeeId, activityIdString);
            this.logger.log(`[EmployeeAccept] Participation created for user=${employeeId} activity=${activityIdString}`);
        } catch (err: any) {
            // If it's a MongoDB duplicate key error (11000) or explicitly 'already exists'
            if (err?.code === 11000 || err?.message?.includes('already exists') || err?.message?.includes('Cannot re-enroll')) {
                this.logger.log(`[EmployeeAccept] Participation already exists (or forbidden) for user=${employeeId}.`);
            } else {
                this.logger.error(`[EmployeeAccept] Failed to create participation: ${err.message}`);
                throw new BadRequestException(`Failed to enroll: ${err.message}`);
            }
        }

        // Notify the manager that the employee accepted
        if (assignment.managerId) {
            try {
                const activityTitle = (assignment.activityId as any)?.title || 'the activity';
                const employee = await this.usersService.findOne(employeeId);
                await this.notificationsService.create({
                    recipientId: assignment.managerId.toString(),
                    title: '✅ Employee Accepted Training',
                    message: `${employee?.name || 'An employee'} has accepted your recommendation for "${activityTitle}" and is now enrolled.`,
                    type: 'activity_accepted',
                    metadata: { assignmentId: id, activityId: activityIdString }
                });
            } catch (err: any) {
                this.logger.error(`[EmployeeAccept] Failed to notify manager: ${err.message}`);
            }
        }

        return assignment;
    }

    async employeeReject(id: string, employeeId: string, reason?: string): Promise<Assignment> {
        const assignment = await this.assignmentModel.findById(id).populate('userId', 'name');
        if (!assignment) throw new NotFoundException('Assignment not found');

        if (assignment.userId.toString() !== employeeId) {
            throw new ForbiddenException('You can only decline assignments meant for you');
        }

        assignment.status = 'declined';
        assignment.reason = reason || 'Declined by employee';
        const saved = await assignment.save();

        // Notify the manager about the decline
        if (assignment.managerId) {
            try {
                const activity = await this.activitiesService.findOne(assignment.activityId.toString());
                const empName = (assignment.userId as any)?.name || 'An employee';
                await this.notificationsService.create({
                    recipientId: assignment.managerId.toString(),
                    title: 'Recommendation Declined',
                    message: `${empName} has declined the recommendation for "${activity?.title || 'Activity'}".`,
                    type: 'activity_rejected',
                    metadata: {
                        assignmentId: id,
                        activityId: assignment.activityId.toString(),
                        reason: assignment.reason
                    }
                });
            } catch (err: any) {
                this.logger.error(`[EmployeeReject] Failed to notify manager about decline: ${err.message}`);
            }
        }

        return saved;
    }
}
