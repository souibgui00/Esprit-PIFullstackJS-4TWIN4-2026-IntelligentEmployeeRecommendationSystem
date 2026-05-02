# Dynamic Scoring & Prioritization Implementation Guide

## Overview
This document provides step-by-step instructions for integrating the Dynamic Scoring and Contextual Prioritization modules into your NestJS backend.

---

## Installation Steps

### Step 1: Add Modules to AppModule

Edit your `app.module.ts` to include the new scoring module:

```typescript
import { ScoringModule } from './scoring/scoring.module';

@Module({
  imports: [
    // ... existing imports
    ScoringModule,
  ],
  // ... rest of configuration
})
export class AppModule {}
```

### Step 2: Create Prioritization Module File

Create `src/prioritization/prioritization.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrioritizationService } from './prioritization.service';
import { User, UserSchema } from '../users/schema/user.schema';
import { Activity, ActivitySchema } from '../activities/schema/activity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: 'Activity', schema: ActivitySchema },
    ]),
  ],
  providers: [PrioritizationService],
  exports: [PrioritizationService],
})
export class PrioritizationModule {}
```

Then update `src/scoring/scoring.module.ts` to include PrioritizationModule:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScoringService } from './scoring.service';
import { ScoringController } from './scoring.controller';
import { PrioritizationService } from '../prioritization/prioritization.service';
import { PrioritizationModule } from '../prioritization/prioritization.module';
import { User, UserSchema } from '../users/schema/user.schema';
import { Activity, ActivitySchema } from '../activities/schema/activity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: 'Activity', schema: ActivitySchema },
      { name: 'Participation', schema: require('../participations/schema/participation.schema').ParticipationSchema },
    ]),
    PrioritizationModule,
  ],
  controllers: [ScoringController],
  providers: [ScoringService, PrioritizationService],
  exports: [ScoringService, PrioritizationService],
})
export class ScoringModule {}
```

### Step 3: Update Participations Module

Integrate automatic score updates in the participations module. Update `src/participations/participations.service.ts`:

```typescript
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class ParticipationsService {
  constructor(
    @InjectModel('Participation')
    private participationModel: Model<any>,
    private scoringService: ScoringService, // Add this
    // ... other dependencies
  ) {}

  async completeParticipation(participationId: string, feedbackRating: number) {
    const participation = await this.participationModel.findByIdAndUpdate(
      participationId,
      { 
        status: 'completed',
        completedAt: new Date(),
        feedbackRating,
      },
      { new: true }
    );

    if (participation) {
      // Automatically update scores
      try {
        await this.scoringService.updateSkoresAfterParticipation(
          participation.userId.toString(),
          participation.activityId.toString(),
          feedbackRating
        );
      } catch (error) {
        console.error('Failed to update scores after participation:', error);
      }
    }

    return participation;
  }
}
```

### Step 4: Update Participations Module Imports

Update `src/participations/participations.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParticipationsService } from './participations.service';
import { ParticipationsController } from './participations.controller';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Participation', schema: ParticipationSchema },
    ]),
    ScoringModule, // Add this import
  ],
  providers: [ParticipationsService],
  controllers: [ParticipationsController],
  exports: [ParticipationsService],
})
export class ParticipationsModule {}
```

### Step 5: Create Database Migration (Optional)

If needed, add indexes for performance in MongoDB:

```typescript
// In any migration file or initialization script
async function createIndexes() {
  const db = mongoose.connection.db;
  
  // Index for faster skill scoring queries
  await db.collection('users').createIndex({ 'skills.skillId': 1 });
  
  // Index for activity score calculations
  await db.collection('activities').createIndex({ 'requiredSkills.skillId': 1 });
  
  // Index for participation lookups
  await db.collection('participations').createIndex({ userId: 1, activityId: 1 });
}
```

---

## API Routes Summary

### Scoring Routes

| Method | Route | Description | Roles |
|--------|-------|-------------|-------|
| GET | `/api/scoring/skill/:userId/:skillId` | Get individual skill score | ADMIN, MANAGER |
| GET | `/api/scoring/employee/:userId/skills` | Get all skills for employee | ADMIN, MANAGER |
| GET | `/api/scoring/activity/:userId/:activityId` | Get activity match score | ADMIN, MANAGER, EMPLOYEE |
| POST | `/api/scoring/participation/update` | Update scores after participation | ADMIN, MANAGER |
| GET | `/api/scoring/analytics/:userId` | Get score analytics | ADMIN, MANAGER, EMPLOYEE |
| POST | `/api/scoring/compare` | Compare multiple employees | ADMIN, MANAGER |

### Prioritization Routes

| Method | Route | Description | Roles |
|--------|-------|-------------|-------|
| GET | `/api/scoring/activity/:activityId/recommendations` | Get employee recommendations | ADMIN, MANAGER |
| PUT | `/api/scoring/activity/:activityId/weight-skills` | Weight skills by importance | ADMIN, MANAGER |
| GET | `/api/scoring/activity/:activityId/skill-gaps/:userId` | Identify skill gaps | ADMIN, MANAGER |
| GET | `/api/scoring/activity/:activityId/skill-levels` | Group employees by level | ADMIN, MANAGER |
| GET | `/api/scoring/activity/:activityId/importance-suggestion` | Get importance recommendation | ADMIN, MANAGER |

---

## Testing the Implementation

### Test 1: Calculate a Skill Score

```bash
curl -X GET "http://localhost:3000/api/scoring/skill/USER_ID/SKILL_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 2: Get Recommendations for an Activity

```bash
curl -X GET "http://localhost:3000/api/scoring/activity/ACTIVITY_ID/recommendations?context=medium&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test 3: Update Scores After Participation

```bash
curl -X POST "http://localhost:3000/api/scoring/participation/update" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "activityId": "ACTIVITY_ID",
    "feedbackRating": 8
  }'
```

### Test 4: Get Score Analytics

```bash
curl -X GET "http://localhost:3000/api/scoring/analytics/USER_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Database Schema Notes

### User Skills Array
The module works with the existing user.skills array structure:

```typescript
{
  skills: [
    {
      skillId: ObjectId,
      level: 'beginner' | 'intermediate' | 'advanced' | 'expert',
      score: Number,          // Calculated and updated by scoring service
      auto_eval: Number,      // User self-assessment (0-100)
      hierarchie_eval: Number, // Manager assessment (0-100)
      progression: Number,
      etat: 'draft' | 'submitted' | 'validated',
      lastUpdated: Date
    }
  ]
}
```

### Activity Required Skills
The module leverages the existing requiredSkills array:

```typescript
{
  requiredSkills: [
    {
      skillId: String,        // ID of the skill
      weight: Number          // Weight in activity (0-2.0)
    }
  ]
}
```

---

## Performance Optimization Tips

### 1. Add Caching for Score Analytics
```typescript
import { Cacheable } from 'class-transformer';

// Cache employee analytics for 5 minutes
@Cacheable({
  duration: 300, // seconds
  key: 'scores:analytics:USER_ID'
})
async getScoreAnalytics(userId: string) {
  // ... implementation
}
```

### 2. Batch Score Updates
For bulk participation updates:

```typescript
async updateMultipleParticipations(updates: Array<{
  userId: string;
  activityId: string;
  feedbackRating: number;
}>) {
  for (const update of updates) {
    await this.scoringService.updateSkoresAfterParticipation(
      update.userId,
      update.activityId,
      update.feedbackRating
    );
  }
}
```

### 3. Database Indexes
Create indexes on frequently queried fields:
```typescript
// In user schema
userSchema.index({ 'skills.skillId': 1 });

// In activity schema
activitySchema.index({ 'requiredSkills.skillId': 1 });
```

---

## Customization

### Adjust Learning Rate
In `scoring.service.ts`, modify the learning rate for skill score updates:
```typescript
const learningRate = 0.1; // Change this value (higher = faster learning)
```

### Modify Context Profiles
In `prioritization.service.ts`, customize profile thresholds:
```typescript
case 'expert':
  filtered = filtered
    .filter(c => c.globalScore >= 70 && c.matchPercentage >= 80)
    // Modify these thresholds as needed
```

### Adjust Score Weights
In the ranking calculation, you can modify category weights:
```typescript
// Currently: 50% know-how, 30% soft skills, 20% knowledge
const finalScore = (avgKnowHow * 0.5) + (avgSoft * 0.3) + (avgKnowledge * 0.2);
```

---

## Troubleshooting

### Issue: Scores not updating after participation
**Solution:** Ensure the `ScoringModule` is properly imported in `ParticipationsModule` and the service is injected.

### Issue: Recommendations returning empty list
**Solution:** Verify that:
1. Employee has required skills or the skill match is possible
2. Context profile thresholds are appropriate for your use case
3. Activity has requiredSkills defined

### Issue: High database load from score calculations
**Solution:**
1. Add database indexes (see Performance section)
2. Implement caching for frequently accessed endpoints
3. Use batch operations for bulk updates

---

## Future Enhancements

Consider these improvements:

1. **Machine Learning Integration**
   - Predict employee growth trajectory
   - Recommend optimal activities for development

2. **Real-time Notifications**
   - Alert managers when employees reach skill milestones
   - Notify employees of recommended activities

3. **Advanced Analytics**
   - Department-wide skill gap analysis
   - Skill trend analysis over time
   - ROI calculation for training activities

4. **Gamification**
   - Skill achievement badges
   - Leaderboards by skill or department
   - Milestone celebrations

5. **Integration with HR Systems**
   - Sync with performance reviews
   - Use in promotion decisions
   - Succession planning

---

## Support & Monitoring

### Health Check Endpoint (Optional)
Add a health check to verify the module is working:

```typescript
@Get('health')
@Public()
async healthCheck() {
  try {
    const testUser = await this.userModel.findOne().select('_id');
    return {
      status: 'healthy',
      database: !!testUser,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}
```

### Logging
The module includes error logging. Monitor logs for:
- Failed score calculations
- Database connection issues
- Missing skill or activity data

### Metrics to Monitor
- Score calculation response times
- Recommendation latency
- Database query performance
- Error rates

---

## Conclusion

You now have a fully functional Dynamic Scoring and Contextual Prioritization system integrated into your HR platform. Follow the integration steps above and test thoroughly in your environment.

For detailed API documentation, see [SCORING_MODULE.md](./SCORING_MODULE.md).
