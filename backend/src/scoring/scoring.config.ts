// scoring.config.ts
// Configuration file for Dynamic Scoring & Prioritization Module

export const ScoringConfig = {
  // ─── SKILL SCORING PARAMETERS ────────────────────────────────────────────

  // Score Range Configuration
  minScore: 0,
  maxScore: 120,  // Allows for bonus growth beyond typical 100-point scale
  
  // Level-based Base Scores
  baseLevelScores: {
    'beginner': 25,
    'intermediate': 50,
    'advanced': 75,
    'expert': 100,
  },

  // Experience Bonus
  experienceBonusMultiplier: 2,  // Points per year of experience
  experienceBonusMax: 20,         // Maximum bonus from experience

  // Progression Bonus
  progressionBonusWindow: 6,      // Months for recent update consideration
  progressionBonus: 5,            // Bonus points for recent updates

  // Evaluation Weights
  evaluationWeights: {
    selfEvaluation: 0.4,           // 40%
    managerEvaluation: 0.6,        // 60%
  },
  evaluationFeedbackMultiplier: 2, // Multiplier to normalize evaluation feedback

  // ─── ACTIVITY SCORING PARAMETERS ─────────────────────────────────────────

  // Learning Rate for Participation
  learningRatePerFeedbackUnit: 0.1, // 10% growth per unit of feedback
  participationFeedbackMax: 10,     // Maximum feedback rating
  participationFeedbackMin: 0,      // Minimum feedback rating

  // ─── CONTEXTUAL PRIORITIZATION PARAMETERS ─────────────────────────────────

  // Context Profile Thresholds
  contextProfiles: {
    low: {
      minGlobalScore: 0,            // Include everyone
      minMatchPercentage: 0,
      scoringFormula: 'learning_potential', // Emphasize learning potential
      learningPotentialBonus: true,
    },
    medium: {
      minGlobalScore: 25,           // Exclude very weak performers
      minMatchPercentage: 0,
      scoringFormula: 'balanced',   // Use actual scores
    },
    expert: {
      minGlobalScore: 70,           // Top performers only
      minMatchPercentage: 80,        // Must have 80%+ skills
      scoringFormula: 'weighted',   // 60% score + 40% match
      scoreWeight: 0.6,
      matchWeight: 0.4,
    },
  },

  // ─── IMPORTANCE WEIGHTING ────────────────────────────────────────────────

  // Base multiplier for each importance level
  importanceMultipliers: {
    1: 0.70,   // Very light
    2: 0.75,
    3: 0.80,
    4: 0.90,
    5: 1.00,   // Normal (no adjustment)
    6: 1.10,
    7: 1.20,
    8: 1.40,   // Heavy
    9: 1.50,
    10: 1.60,  // Critical
  },

  // Maximum allowed weight for any skill in an activity
  maxSkillWeight: 2.0,

  // ─── IMPORTANCE SUGGESTION PARAMETERS ────────────────────────────────────

  // Factors affecting importance suggestion
  importanceSuggestion: {
    skillCountWeights: {
      1: 1,     // 1 skill = +1 importance point
      3: 2,     // 3 skills = +2
      5: 3,     // 5+ skills = +3
    },
    skillWeightWeights: {
      0.5: 1,   // Average weight 0.5 = +1
      1.0: 2,   // Average weight 1.0 = +2
      1.5: 3,   // Average weight 1.5+ = +3
    },
    activityLevelWeights: {
      'beginner': 0,
      'intermediate': 1,
      'advanced': 2,
    },
    activityTypeWeights: {
      'training': 0,
      'workshop': 1,
      'mentoring': 1,
      'webinar': 0,
    },
    baseImportance: 1, // Minimum importance suggestion
  },

  // ─── SKILL GAP DEFINITION ─────────────────────────────────────────────────

  // What constitutes a skill level gap
  skillLevelGaps: {
    beginner: 'insufficient for intermediate activity',
    intermediate: 'insufficient for advanced activity',
    advanced: 'insufficient for expert activity',
  },

  // ─── RANK CALCULATION ────────────────────────────────────────────────────

  // Rank thresholds based on score
  rankThresholds: {
    'Junior': { min: 0, max: 45 },
    'Mid': { min: 45, max: 75 },
    'Senior': { min: 75, max: 95 },
    'Expert': { min: 95, max: 120 },
  },

  // Category weights for rank calculation
  rankCategoryWeights: {
    'knowledge': 0.50,      // 50%
    'knowHow': 0.30,        // 30%
    'softSkill': 0.20,      // 20%
  },

  // ─── TIE RESOLUTION PRIORITY ─────────────────────────────────────────────

  tieResolutionPriority: [
    'contextScore',          // 1. Primary sorting criterion
    'rank',                  // 2. Overall rank (Expert > Senior > Mid > Junior)
    'rankScore',            // 3. Global skill score
    'globalActivityScore',  // 4. Score for this activity
    'name',                 // 5. Alphabetical (final tiebreaker)
  ],

  rankOrderForTieResolution: {
    'Expert': 4,
    'Senior': 3,
    'Mid': 2,
    'Junior': 1,
  },

  // ─── GROUPING PARAMETERS ─────────────────────────────────────────────────

  // Employee skill level grouping thresholds
  skillLevelGrouping: {
    expert: {
      minScore: 85,
      minMatch: 100,
      description: 'Can lead activity, minimal oversight needed',
    },
    advanced: {
      minScore: 65,
      minMatch: 80,
      description: 'Ready to participate, may need minor support',
    },
    intermediate: {
      minScore: 45,
      minMatch: 60,
      description: 'Good fit with mentoring support',
    },
    beginner: {
      minScore: 25,
      minMatch: 40,
      description: 'Learning opportunity, needs substantial support',
    },
    insufficient: {
      minScore: 0,
      minMatch: 0,
      description: 'Not ready, recommend foundational training first',
    },
  },

  // ─── API PAGINATION DEFAULTS ─────────────────────────────────────────────

  defaultLimitRecommendations: 10,
  maxLimitRecommendations: 100,

  // ─── CACHING CONFIGURATION ──────────────────────────────────────────────

  cache: {
    enabled: false,  // Set to true to enable caching
    defaults: {
      analyticsDuration: 300,      // 5 minutes
      recommendationsDuration: 600, // 10 minutes
      skillScoreDuration: 300,      // 5 minutes
    },
  },

  // ─── LOGGING & MONITORING ────────────────────────────────────────────────

  logging: {
    enabled: true,
    logScoreCalculations: false,      // Verbose logging
    logRecommendationGeneration: false,
    logSkillGapAnalysis: false,
  },

  // ─── VALIDATION ──────────────────────────────────────────────────────────

  validation: {
    requireSkillsForActivity: true,   // Activity must have required skills
    allowSelfHealing: true,            // Auto-add missing skills from activities
    validateFeedbackRange: true,      // Enforce 0-10 feedback range
  },

  // ─── ADJUSTABLE WEIGHTS FOR CUSTOM FORMULAS ──────────────────────────────

  customFormulas: {
    // Alternative weighting schemes
    performance: {
      // More emphasis on actual scores
      baseScore: 0.45,
      experience: 0.25,
      progression: 0.15,
      feedback: 0.15,
    },
    potential: {
      // More emphasis on growth potential
      baseScore: 0.25,
      experience: 0.15,
      progression: 0.30,
      feedback: 0.30,
    },
    balanced: {
      // Evenly weighted (current default)
      baseScore: 0.40,
      experience: 0.20,
      progression: 0.15,
      feedback: 0.25,
    },
  },
};

/**
 * CONFIGURATION GUIDE
 * 
 * How to customize these parameters:
 * 
 * 1. LEARNING RATE (learningRatePerFeedbackUnit)
 *    Current: 0.1 (10% per feedback unit)
 *    Higher: Employees gain skills faster (0.15 = 15% per unit)
 *    Lower: Slower but steadier growth (0.05 = 5% per unit)
 *    Use case: Adjust based on organization's expected growth pace
 * 
 * 2. CONTEXT PROFILE THRESHOLDS
 *    Customize minGlobalScore and minMatchPercentage for each context
 *    Example: Make 'expert' more inclusive by lowering from (70, 80) to (60, 70)
 * 
 * 3. IMPORTANCE MULTIPLIERS
 *    Adjust how importance level affects skill weights
 *    Range per importance: 0.7 (light) to 1.6 (critical)
 *    Can be extended or made more granular
 * 
 * 4. BASE LEVEL SCORES
 *    Current: beginner=25, intermediate=50, advanced=75, expert=100
 *    Can adjust these to reflect your organization's skill baseline
 * 
 * 5. RANK THRESHOLDS
 *    Current: Junior (0-45), Mid (45-75), Senior (75-95), Expert (95-120)
 *    Adjust to make ranks harder/easier to achieve
 * 
 * 6. CATEGORY WEIGHTS
 *    Currently: 50% knowledge, 30% know-how, 20% soft skills
 *    Adjust based on what your organization values most
 * 
 * TESTING CHANGES:
 * - Update config values
 * - Run score calculations on test data
 * - Compare with expected results
 * - Validate recommendations match new thresholds
 */

export default ScoringConfig;
