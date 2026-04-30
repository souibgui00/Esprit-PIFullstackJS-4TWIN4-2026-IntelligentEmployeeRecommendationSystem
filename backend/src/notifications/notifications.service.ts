import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './schema/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
    options: { emitRealtime?: boolean } = { emitRealtime: true },
  ): Promise<Notification> {
    const notification = new this.notificationModel(createNotificationDto);
    const saved = await notification.save();

    // Push via WebSocket
    if (options.emitRealtime !== false) {
      try {
        this.notificationsGateway.emitToUser(
          saved.recipientId.toString(),
          'newNotification',
          saved,
        );
      } catch (error) {
        this.logger.error('Failed to emit WebSocket notification:', error);
      }
    }

    return saved;
  }

  async findByRecipient(recipientId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ recipientId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(id: string): Promise<Notification | null> {
    return this.notificationModel
      .findByIdAndUpdate(id, { read: true }, { new: true })
      .exec();
  }

  async markAllAsRead(recipientId: string): Promise<any> {
    return this.notificationModel
      .updateMany({ recipientId, read: false }, { read: true })
      .exec();
  }

  async remove(id: string): Promise<any> {
    return this.notificationModel.findByIdAndDelete(id).exec();
  }
}
