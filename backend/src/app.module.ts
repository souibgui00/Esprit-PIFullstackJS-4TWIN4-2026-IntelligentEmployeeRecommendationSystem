import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SkillsModule } from './skills/skills.module';
import { PostsModule } from './posts/posts.module';
import { DepartmentsModule } from './departments/departments.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { ParticipationsModule } from './participations/participations.module';
import { ActivitiesModule } from './activities/activities.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { FaceRecognitionModule } from './face-recognition/face-recognition.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { SettingsModule } from './settings/settings.module';
import { ScoringModule } from './scoring/scoring.module';
import { AuditModule } from './common/audit/audit.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        if (!uri) {
          throw new Error('MONGODB_URI is not set');
        }
        return {
          uri,
          connectionFactory: (connection) => {
            connection.on('connected', () => console.log('MongoDB connected'));
            connection.on('error', (err: Error) => console.error('MongoDB connection error:', err));
            return connection;
          },
        };
      },
    }),
    CommonModule,
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    SkillsModule,
    PostsModule,
    DepartmentsModule,
    ParticipationsModule,
    ActivitiesModule,
    CloudinaryModule,
    FaceRecognitionModule,
    NotificationsModule,
    AssignmentsModule,
    EvaluationsModule,
    SettingsModule,
    ScoringModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }


