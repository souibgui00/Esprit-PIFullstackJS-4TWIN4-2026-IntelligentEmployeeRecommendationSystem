import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog } from './audit-log.schema';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLog>,
  ) {}

  async logAction(data: {
    action: string;
    entityType: string;
    entityId: string;
    actorId: string;
    oldValue?: any;
    newValue?: any;
    metadata?: any;
  }): Promise<AuditLog | null> {
    try {
      const auditLog = new this.auditLogModel({
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        actorId: new Types.ObjectId(data.actorId),
        oldValue: data.oldValue,
        newValue: data.newValue,
        metadata: data.metadata,
      });
      return await auditLog.save();
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to create audit log for ${data.action} on ${data.entityType} ${data.entityId}: ${err.message}`,
        err.stack,
      );
      // In critical systems, you might want to rethrow or alert here.
      // For now, returning null or swallowing so it doesn't break main workflows is common practice unless logging is strictly mandated to block transactions.
      return null;
    }
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogModel
      .find({ entityType, entityId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByActor(actorId: string): Promise<AuditLog[]> {
    return this.auditLogModel
      .find({ actorId } as any)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(): Promise<AuditLog[]> {
    return this.auditLogModel
      .find({})
      .populate('actorId', 'name email role _id') // Populates who did the action
      .sort({ createdAt: -1 }) // Newest first
      .limit(200) // For UI performance
      .exec();
  }
}
