# Dynamic Scoring & Optimization Module

This module provides comprehensive scoring and employee prioritization functionality for activity recommendations and management.

## Overview

The scoring module consists of two integrated components:
1. **Dynamic Scoring Module** - Calculates and manages skill scores for employees and activities
2. **Optimization and Contextual Prioritization Module** - Intelligently recommends and prioritizes employees based on skills and context

---

## 1. Dynamic Scoring Module

### Purpose
Provides numeric scoring for employee skills and activities with automatic updates after participation.

### Key Features

#### 1.1 Individual Skill Scoring
Calculates a comprehensive score (0-120) for each employee's skill based on:

**Formula:**
```
Final Score = Base Score + Experience Bonus + Progression Bonus + Weighted Feedback

Where:
- Base Score = Proficiency level (beginner: 25, intermediate: 50, advanced: 75, expert: 100)
- Experience Bonus = Years × 2 (capped at 20)
- Progression Bonus = 5 points if updated in last 6 months
- Weighted Feedback = (40% self-eval + 60% manager-eval) × 2
```

**Range:** 0-120 (allows growth beyond 100)

**Endpoint:**
```
GET /api/scoring/skill/:userId/:skillId
```

**Response:**
```json
{
  "success": true,
  "userId": "653a1b2c3d4e5f6g7h8i9j0k",
  "skillId": "562b2c3d4e5f6g7h8i9j0k1",
  "score": 87.5
}
```

---

#### 1.2 Employee Skill Scores
Get all skill scores for an employee with detailed metadata.

**Endpoint:**
```
GET /api/scoring/employee/:userId/skills
```

**Response:**
```json
{
  "success": true,
  "userId": "653a1b2c3d4e5f6g7h8i9j0k",
  "totalSkills": 5,
  "skillScores": [
    {
      "skillId": "562b2c3d4e5f6g7h8i9j0k1",
      "skillName": "TypeScript",
      "skillType": "knowHow",
      "level": "advanced",
      "score": 87.5,
      "auto_eval": 80,
      "hierarchie_eval": 85,
      "lastUpdated": "2024-03-20T10:30:00Z"
    },
    {
      "skillId": "562b2c3d4e5f6g7h8i9j0k2",
      "skillName": "Leadership",
      "skillType": "softSkill",
      "level": "intermediate",
      "score": 65.3,
      "auto_eval": 60,
      "hierarchie_eval": 70,
      "lastUpdated": "2024-03-15T14:20:00Z"
    }
  ]
}
```

---

#### 1.3 Global Activity Score
Calculates a composite score indicating how well an employee matches an activity.

**Formula:**
```
Global Activity Score = Σ (Skill Score × Skill Weight) / Total Weights

Where:
- Skill Score = Employee's calculated score for that skill
- Skill Weight = Activity's assigned weight for that skill
```

**Endpoint:**
```
GET /api/scoring/activity/:userId/:activityId
```

**Response:**
```json
{
  "success": true,
  "userId": "653a1b2c3d4e5f6g7h8i9j0k",
  "activityId": "672c3d4e5f6g7h8i9j0k1l2",
  "globalActivityScore": 76.8,
  "matchPercentage": 80
}
```

**Interpretation:**
- **Global Activity Score**: Average skill match weighted by activity requirements (0-120)
- **Match Percentage**: % of required skills the employee possesses (0-100)

---

#### 1.4 Automatic Score Updates After Participation

Automatically updates skill scores when an employee completes an activity with feedback.

**Formula:**
```
New Skill Score = Old Score + (Feedback Rating × Skill Weight × Learning Rate)

Where:
- Feedback Rating = 0-10 scale
- Skill Weight = Weight given to that skill in the activity
- Learning Rate = 0.1 (10% growth per feedback unit)
- Maximum Score = 120 (capped)
```

**Endpoint:**
```
POST /api/scoring/participation/update

Body:
{
  "userId": "653a1b2c3d4e5f6g7h8i9j0k",
  "activityId": "672c3d4e5f6g7h8i9j0k1l2",
  "feedbackRating": 8
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scores updated successfully after participation",
  "result": {
    "userId": "653a1b2c3d4e5f6g7h8i9j0k",
    "activityId": "672c3d4e5f6g7h8i9j0k1l2",
    "feedbackRating": 8,
    "updatedSkills": 3,
    "timestamp": "2024-03-25T15:45:00Z"
  }
}
```

---

#### 1.5 Score Analytics

Get comprehensive analytics for an employee's skill scores including distribution and category breakdown.

**Endpoint:**
```
GET /api/scoring/analytics/:userId
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "userId": "653a1b2c3d4e5f6g7h8i9j0k",
    "totalSkills": 8,
    "averageScore": 72.5,
    "minScore": 45,
    "maxScore": 95,
    "categoryBreakdown": {
      "knowHow": {
        "count": 4,
        "totalScore": 320,
        "averageScore": 80
      },
      "softSkill": {
        "count": 2,
        "totalScore": 135,
        "averageScore": 67.5
      },
      "knowledge": {
        "count": 2,
        "totalScore": 105,
        "averageScore": 52.5
      }
    },
    "skillDetails": [
      {
        "skillId": "562b2c3d4e5f6g7h8i9j0k1",
        "skillName": "TypeScript",
        "skillType": "knowHow",
        "level": "advanced",
        "score": 87.5,
        "lastUpdated": "2024-03-20T10:30:00Z"
      }
    ]
  }
}
```

---

#### 1.6 Compare Employee Scores

Compare skill scores across multiple employees for benchmarking and team analysis.

**Endpoint:**
```
POST /api/scoring/compare

Body:
{
  "userIds": [
    "653a1b2c3d4e5f6g7h8i9j0k",
    "762c3d4e5f6g7h8i9j0k2l3",
    "872d4e5f6g7h8i9j0k3l4m5"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "comparisons": [
    {
      "_id": "653a1b2c3d4e5f6g7h8i9j0k",
      "name": "Alice Johnson",
      "email": "alice@company.com",
      "matricule": "EMP-2024-5421",
      "rank": "Senior",
      "rankScore": 82,
      "scoreAnalytics": {
        "totalSkills": 8,
        "averageScore": 78.5,
        "minScore": 65,
        "maxScore": 95,
        "categoryBreakdown": { ... }
      }
    }
  ]
}
```

---

## 2. Optimization and Contextual Prioritization Module

### Purpose
Intelligently recommends and prioritizes employees for activities based on skill match, context, and conflict resolution.

### Key Features

#### 2.1 Context-Based Employee Recommendations

Get recommended employees for an activity using intelligent context-based selection.

**Context Profiles:**

1. **LOW** - Learning-focused selection
   - Includes broader range of employees
   - Emphasizes potential to learn
   - Ideal for training and development activities
   - Score = 50% current skill match + 50% learning potential

2. **MEDIUM** - Balanced selection (default)
   - Filters out minimal candidates (score < 25)
   - Includes qualified and developing employees
   - Ideal for most regular activities
   - Score = Current skill match score

3. **EXPERT** - High-performance selection
   - Only includes top performers (score ≥ 70 and match ≥ 80%)
   - Highest standards for critical activities
   - Ideal for mission-critical or premium activities
   - Score = 60% skill score + 40% match percentage

**Endpoint:**
```
GET /api/scoring/activity/:activityId/recommendations?context=medium&limit=10
```

**Query Parameters:**
- `context`: 'low' | 'medium' (default) | 'expert'
- `limit`: Number of recommendations (default: 10)

**Response:**
```json
{
  "success": true,
  "activityId": "672c3d4e5f6g7h8i9j0k1l2",
  "context": "medium",
  "totalRecommendations": 5,
  "recommendations": [
    {
      "employeeId": "653a1b2c3d4e5f6g7h8i9j0k",
      "name": "Alice Johnson",
      "email": "alice@company.com",
      "rank": "Senior",
      "rankScore": 82,
      "globalScore": 78.5,
      "matchPercentage": 95,
      "skillGaps": [],
      "contextScore": 78.5,
      "recommendation": "Highly recommended - Excellent match with all required skills"
    },
    {
      "employeeId": "762c3d4e5f6g7h8i9j0k2l3",
      "name": "Bob Martinez",
      "email": "bob@company.com",
      "rank": "Mid",
      "rankScore": 65,
      "globalScore": 62.3,
      "matchPercentage": 80,
      "skillGaps": [
        {
          "skillId": "562b2c3d4e5f6g7h8i9j0k3",
          "skillName": "Advanced React",
          "gap": "insufficient_level",
          "currentLevel": "intermediate",
          "requiredLevel": "advanced"
        }
      ],
      "contextScore": 62.3,
      "recommendation": "Recommended with mentoring - Missing advanced React experience"
    }
  ]
}
```

---

#### 2.2 Skill Weighting by Activity Importance

Adjust skill weights based on activity importance level.

**Importance Scale:** 1-10
- 1-3: Light (multiplier 0.7-0.9)
- 4-7: Normal (multiplier 1.0-1.3)
- 8-10: Heavy (multiplier 1.4-1.6)

**Endpoint:**
```
PUT /api/scoring/activity/:activityId/weight-skills

Body:
{
  "importance": 8
}
```

**Response:**
```json
{
  "success": true,
  "message": "Skills weighted by activity importance",
  "result": {
    "activityId": "672c3d4e5f6g7h8i9j0k1l2",
    "importance": 8,
    "weightMultiplier": 1.48,
    "updatedSkills": [
      {
        "skillId": "562b2c3d4e5f6g7h8i9j0k1",
        "weight": 1.5
      },
      {
        "skillId": "562b2c3d4e5f6g7h8i9j0k2",
        "weight": 1.2
      }
    ]
  }
}
```

---

#### 2.3 Skill Gap Analysis

Identify missing or insufficient skills for an employee relative to activity requirements.

**Gap Types:**
- `not_acquired`: Skill not in employee's profile
- `insufficient_level`: Skill exists but level is too low

**Endpoint:**
```
GET /api/scoring/activity/:activityId/skill-gaps/:userId
```

**Response:**
```json
{
  "success": true,
  "userId": "653a1b2c3d4e5f6g7h8i9j0k",
  "activityId": "672c3d4e5f6g7h8i9j0k1l2",
  "skillGapsCount": 2,
  "skillGaps": [
    {
      "skillId": "562b2c3d4e5f6g7h8i9j0k3",
      "skillName": "Advanced React",
      "skillType": "insufficient_level",
      "currentLevel": "intermediate",
      "requiredLevel": "advanced",
      "requiredWeight": 0.8,
      "gap": "level_mismatch"
    },
    {
      "skillId": "562b2c3d4e5f6g7h8i9j0k4",
      "skillName": "AWS Deployment",
      "skillType": "missing",
      "requiredWeight": 0.6,
      "gap": "not_acquired"
    }
  ]
}
```

---

#### 2.4 Employees Grouped by Skill Level

Get employees for an activity grouped into proficiency tiers.

**Tiers:**
- **expert**: Score ≥ 85 AND 100% match
- **advanced**: Score ≥ 65 AND ≥ 80% match
- **intermediate**: Score ≥ 45 AND ≥ 60% match
- **beginner**: Score ≥ 25 OR ≥ 40% match
- **insufficient**: Below beginner threshold

**Endpoint:**
```
GET /api/scoring/activity/:activityId/skill-levels
```

**Response:**
```json
{
  "success": true,
  "activityId": "672c3d4e5f6g7h8i9j0k1l2",
  "groupedBySkillLevel": {
    "expert": [
      {
        "employeeId": "653a1b2c3d4e5f6g7h8i9j0k",
        "name": "Alice Johnson",
        "email": "alice@company.com",
        "rank": "Senior",
        "globalScore": 88,
        "matchPercentage": 100
      }
    ],
    "advanced": [
      {
        "employeeId": "762c3d4e5f6g7h8i9j0k2l3",
        "name": "Bob Martinez",
        "email": "bob@company.com",
        "rank": "Mid",
        "globalScore": 72,
        "matchPercentage": 85
      }
    ],
    "intermediate": [
      {
        "employeeId": "872d4e5f6g7h8i9j0k3l4m5",
        "name": "Carol Chen",
        "email": "carol@company.com",
        "rank": "Junior",
        "globalScore": 55,
        "matchPercentage": 70
      }
    ],
    "beginner": [],
    "insufficient": []
  }
}
```

---

#### 2.5 Activity Importance Suggestion

Get AI-suggested importance level for an activity based on skill requirements.

**Factors Considered:**
1. Number of required skills
2. Average skill weight
3. Activity level (difficulty)
4. Activity type

**Endpoint:**
```
GET /api/scoring/activity/:activityId/importance-suggestion
```

**Response:**
```json
{
  "success": true,
  "suggestion": {
    "activityId": "672c3d4e5f6g7h8i9j0k1l2",
    "activityTitle": "Enterprise Architecture Workshop",
    "suggestedImportance": 8,
    "factors": {
      "requiredSkillsCount": 6,
      "averageWeight": 1.2,
      "level": "advanced",
      "type": "workshop"
    },
    "reasoning": "Suggested importance 8/10: requires 6 skills, high average skill weight, advanced difficulty level"
  }
}
```

---

## 3. Tie Resolution Strategy

When multiple employees have identical scores, the system resolves ties using this priority order:

1. **Context Score** - Primary sorting criterion
2. **Overall Rank** (Expert > Senior > Mid > Junior)
3. **Rank Score** - Global skill proficiency
4. **Global Activity Score** - Score for this specific activity
5. **Name** - Alphabetical (final tiebreaker)

---

## 4. Usage Examples

### Example 1: Recommend Team for a New Training

```bash
# Step 1: Get importance suggestion
curl -X GET "http://localhost:3000/api/scoring/activity/672c3d4e5f6g7h8i9j0k1l2/importance-suggestion" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response suggests importance: 7

# Step 2: Weight skills by importance
curl -X PUT "http://localhost:3000/api/scoring/activity/672c3d4e5f6g7h8i9j0k1l2/weight-skills" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"importance": 7}'

# Step 3: Get recommendations for balanced team
curl -X GET "http://localhost:3000/api/scoring/activity/672c3d4e5f6g7h8i9j0k1l2/recommendations?context=medium&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Example 2: Monitor Employee Development

```bash
# Get employee's skill analytics
curl -X GET "http://localhost:3000/api/scoring/analytics/653a1b2c3d4e5f6g7h8i9j0k" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# After activity completion, update scores
curl -X POST "http://localhost:3000/api/scoring/participation/update" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "653a1b2c3d4e5f6g7h8i9j0k",
    "activityId": "672c3d4e5f6g7h8i9j0k1l2",
    "feedbackRating": 9
  }'

# Re-check analytics to see improvement
curl -X GET "http://localhost:3000/api/scoring/analytics/653a1b2c3d4e5f6g7h8i9j0k" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Example 3: Identify Development Opportunities

```bash
# Identify skill gaps
curl -X GET "http://localhost:3000/api/scoring/activity/672c3d4e5f6g7h8i9j0k1l2/skill-gaps/653a1b2c3d4e5f6g7h8i9j0k" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# View team distribution by skill level
curl -X GET "http://localhost:3000/api/scoring/activity/672c3d4e5f6g7h8i9j0k1l2/skill-levels" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 5. Integration Notes

### Authorization
- All endpoints require JWT authentication
- Specific endpoints require ADMIN or MANAGER role
- Some endpoints accessible to EMPLOYEE role

### Database Models
- Requires existing User, Activity, and Participation models
- Updates skill data in user.skills array
- Creates/updates participation records

### Performance Considerations
- Score calculations use aggregation where possible
- Consider caching for frequently accessed analytics
- Batch updates available for bulk participation record processing

---

## 6. Configuration

Adjustable parameters in the service files:

```typescript
// In scoring.service.ts
private learningRate = 0.1;        // 10% growth rate per feedback unit
private maxScore = 120;             // Maximum achievable score
private progressionWindow = 6;      // Months for progression bonus

// In prioritization.service.ts
private contextProfiles = {
  low: { minScore: 0 },
  medium: { minScore: 25 },
  expert: { minScore: 70, minMatch: 80 }
};
```

---

## 7. Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "User not found"
}
```

Common error codes:
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Resource not found
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Insufficient permissions

---

## Summary

This module provides:
- ✅ Dynamic skill scoring with multiple factors
- ✅ Automatic score updates after participation
- ✅ Context-aware employee recommendations
- ✅ Skill gap analysis and identification
- ✅ Intelligent tie resolution
- ✅ Comprehensive analytics and comparisons
- ✅ Activity importance weighting
