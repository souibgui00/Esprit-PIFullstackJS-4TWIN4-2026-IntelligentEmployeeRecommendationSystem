# Quick Reference Guide: Dynamic Scoring & Prioritization

## Common Workflows

### 1. Recommend Team for Activity (Manager Use Case)

**Goal:** Find the best 5 employees for a new workshop on React.js

**Steps:**
```bash
# Step 1: Get importance suggestion
GET /api/scoring/activity/{activityId}/importance-suggestion
→ Response: suggestedImportance: 7

# Step 2: Weight skills by importance
PUT /api/scoring/activity/{activityId}/weight-skills
Body: { "importance": 7 }

# Step 3: Get recommendations
GET /api/scoring/activity/{activityId}/recommendations?context=medium&limit=5
→ Response: [Alice (match 95%), Bob (match 80%), Carol (match 75%), ...]

# Step 4: Review skill gaps for top recommendation
GET /api/scoring/activity/{activityId}/skill-gaps/{userId}
→ Response: Shows what Alice needs to improve
```

**Expected Outcomes:**
- Balanced team mix of experienced and developing employees
- Clear understanding of each person's fit
- Identified development opportunities

---

### 2. Monitor Employee Growth (HR Use Case)

**Goal:** Track Alice's skill development over 3 months

**Initial State:**
```bash
# Get baseline scores
GET /api/scoring/analytics/{userId}
→ Response: 
  totalSkills: 5
  averageScore: 68.5
  categoryBreakdown: {...}
```

**Month 1-3: Activities with Feedback**
```bash
# After each activity completion
POST /api/scoring/participation/update
Body: {
  "userId": "{userId}",
  "activityId": "{activityId}",
  "feedbackRating": 8
}
```

**Check Progress:**
```bash
# After 3 months
GET /api/scoring/analytics/{userId}
→ Response: 
  totalSkills: 6
  averageScore: 75.2  # Improved from 68.5
  newSkills: acquired
```

**Insight:** Alice's average score improved 9.8% over 3 months through targeted activities

---

### 3. Identify Training Needs (HR Use Case)

**Goal:** Find skill gaps in the team before busy season

**Steps:**
```bash
# Get all employees grouped by capability
GET /api/scoring/activity/{criticalActivityId}/skill-levels
→ Response:
  expert: [3 employees]
  advanced: [5 employees]
  intermediate: [8 employees]
  beginner: [2 employees]
  insufficient: [1 employee]

# Deep dive: Get gaps for each group
GET /api/scoring/activity/{acticalActivityId}/skill-gaps/{userId}
→ For intermediate group, identify common missing skills
```

**Action:** Create targeted training programs for beginner/insufficient groups

---

### 4. Compare Team Performance (Manager Use Case)

**Goal:** See how tech team stacks up for a new project

**Steps:**
```bash
# Compare 3 team leads
POST /api/scoring/compare
Body: {
  "userIds": ["alice_id", "bob_id", "carol_id"]
}
→ Response:
  [{
    name: "Alice Johnson",
    rank: "Senior",
    rankScore: 82,
    averageScore: 78.5,
    totalSkills: 8
  }, ...]
```

**Insight:** Use this for:
- Project lead assignment
- Competency verification
- Succession planning
- Mentoring pairings

---

### 5. Select Optimal Candidates by Context (HR Use Case)

**Goal:** Different contexts = different selections

**Scenario A: Training Program (Learning Focus)**
```bash
GET /api/scoring/activity/{trainingId}/recommendations?context=low
→ Includes broader range, emphasizes learning potential
→ Good for: New hires, career development
```

**Scenario B: Regular Workshop (Balanced)**
```bash
GET /api/scoring/activity/{workshopId}/recommendations?context=medium
→ Default balanced selection
→ Good for: Standard activities
```

**Scenario C: Critical Project (Expert Only)**
```bash
GET /api/scoring/activity/{criticalProjectId}/recommendations?context=expert
→ Only top performers (score ≥70, match ≥80%)
→ Good for: High-stakes projects, mission-critical work
```

---

## Key Metrics Explained

### Global Activity Score (0-120)
**What it means:** How well employee's skills match activity requirements

**Example Calculation:**
```
Activity requires: TypeScript (weight 0.8), React (weight 0.6)
Employee scores: TypeScript = 85, React = 70

Global Score = (85×0.8 + 70×0.6) / (0.8+0.6)
            = (68 + 42) / 1.4
            = 78.6
```

**Interpretation:**
- 90-120: Excellent fit
- 70-89: Good fit, maybe minor gaps
- 50-69: Moderate fit, training needed
- 30-49: Weak fit, substantial learning curve
- 0-29: Not ready without major development

### Match Percentage (0-100%)
**What it means:** % of activity's required skills employee actually has

**Example:**
```
Activity requires: 5 skills
Employee has: 4 of those skills
Match = 4/5 = 80%

Interpretation:
- 100%: Has all required skills
- 80%: Missing 1/5 skills
- 60%: Missing 2/5 skills
- Below 60%: Significant gaps
```

### Rank Score (0-120)
**What it means:** Overall employee skill proficiency

**Scale:**
- Junior: 0-45
- Mid: 45-75
- Senior: 75-95
- Expert: 95+

### Skill Score (0-120)
**What it means:** Individual skill mastery level

**Formula Components:**
- Base (25-100): Proficiency level
- Experience (0-20): Years on job
- Progression (0-5): Recent activity
- Feedback (0-20): Manager + self-eval

---

## Quick Decisions Guide

### When to use each context profile?

| Context | Best For | Example Scenarios |
|---------|----------|------------------|
| **LOW** | Learning/Growth | New training, rotation programs, junior development |
| **MEDIUM** | Balanced | Regular workshops, standard projects, team building |
| **EXPERT** | Critical Work | High-stakes projects, client work, sensitive tasks |

### Score Ranges Decision Matrix

| Global Score | Match % | Decision | Action |
|--------------|---------|----------|--------|
| 85-120 | 100% | Auto-accept | Assign immediately |
| 70-84 | 80-99% | Suitable | Assign, minimal support |
| 60-69 | 70-79% | Consider | Assign with mentoring |
| 50-59 | 60-69% | Review | Assign for learning |
| <50 | <60% | Decline | Offer training first |

---

## Common API Patterns

### Pattern 1: Single Employee Assessment
```
GET /api/scoring/employee/:userId/skills
→ Detailed breakdown of all skills
```

### Pattern 2: Activity-Centric Analysis
```
GET /api/scoring/activity/:activityId/recommendations
GET /api/scoring/activity/:activityId/skill-levels
GET /api/scoring/activity/:activityId/skill-gaps/:userId
```

### Pattern 3: Bulk Comparison
```
POST /api/scoring/compare
→ Compare multiple employees side-by-side
```

### Pattern 4: Complete Workflow
```
GET .../importance-suggestion
→ PUT .../weight-skills
→ GET .../recommendations
→ GET .../skill-gaps
```

---

## Troubleshooting Quick Fixes

| Problem | Quick Fix | Command |
|---------|-----------|---------|
| No recommendations returned | Check context profile | Add `?context=low` |
| Scores don't match expectation | Check feedback rating | Should be 0-10 |
| Skill gaps look wrong | Verify activity requirements | Check activity.requiredSkills |
| Different results each run | Might be tied scores | Check employee names in results |

---

## Performance Tips

**For Large Teams (>100 employees):**
- Use batch compare API for multiple employees
- Add caching to analytics endpoints
- Consider running recommendations off-peak

**For Complex Activities (>10 skills):**
- Set importance level first
- Filter by context and limit results
- Review skill gaps separately

---

## Data Refresh Strategy

**Real-time Updates:**
- Scores auto-update after activity completion
- Changes visible in next GET request

**Recommended Refresh Schedule:**
- Analytics: Check monthly for trends
- Recommendations: Generate when needed
- Skill gaps: Review before activity assignment

---

## Success Metrics

Monitor these KPIs:

1. **Average Activity Match:** Should be 70%+
2. **Context Alignment:** % of recommendations accepted by managers
3. **Score Improvement:** Average 5-10% growth per quarter
4. **Skill Gap Closure:** Most common gaps should have training assigned

---

## Integration Checklist

Before going live:

- [ ] Module imported in AppModule
- [ ] Participation service configured for auto-updates
- [ ] Database indexes created
- [ ] API endpoints tested with real data
- [ ] JWT authentication verified
- [ ] ADMIN/MANAGER roles assigned
- [ ] Departments and managers configured
- [ ] Skills catalog populated
- [ ] Activities with required skills created
- [ ] Team trained on new endpoints

---

## API Response Formats

### Success Response
```json
{
  "success": true,
  "userId": "...",
  "data": {...}
}
```

### Error Response
```json
{
  "success": false,
  "message": "User not found"
}
```

### Status Codes
- 200: Success
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Server error

---

## Next Steps

1. **Read** [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for detailed setup
2. **Review** [SCORING_MODULE.md](./SCORING_MODULE.md) for complete API reference
3. **Test** endpoints in Postman or your API client
4. **Deploy** to development environment
5. **Gather feedback** from managers and HR
6. **Iterate** on thresholds and weights based on results

---

## Questions & Support

For specific questions:
- **API Issues:** Check endpoint documentation in SCORING_MODULE.md
- **Integration:** See IMPLEMENTATION_GUIDE.md section 4
- **Customization:** Look for "Customization" in IMPLEMENTATION_GUIDE.md
- **Performance:** Check "Performance Optimization Tips" section

---

**Last Updated:** March 2024  
**Module Version:** 1.0.0  
**Status:** Production Ready
