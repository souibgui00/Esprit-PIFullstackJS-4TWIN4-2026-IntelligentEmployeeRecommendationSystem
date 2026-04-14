// INTEGRATION EXAMPLES - À implémenter ultérieurement
// =====================================================

// ✅ Service créé et testé
// 📍 Fichier : src/scoring/recommendation-model.service.ts
// 📍 Module : ScoringModule (déjà mis à jour)

/**
 * EXEMPLE 1 : Intégrer dans ScoringController
 * ============================================
 */

// Dans src/scoring/scoring.controller.ts
/* 
import { RecommendationModelService } from './recommendation-model.service';

@Controller('api/scoring')
export class ScoringController {
  constructor(
    private recommendationModelService: RecommendationModelService,
    // ... autres services
  ) {}

  @Post(':userId/predict/:activityId')
  @UseGuards(JwtAuthGuard)
  async predictScore(
    @Param('userId') userId: string,
    @Param('activityId') activityId: string,
  ) {
    const score = await this.recommendationModelService.predictScore(userId, activityId);
    return { userId, activityId, score };
  }

  @Get(':userId/breakdown/:activityId')
  @UseGuards(JwtAuthGuard)
  async getScoreBreakdown(
    @Param('userId') userId: string,
    @Param('activityId') activityId: string,
  ) {
    return await this.recommendationModelService.getScoreBreakdown(userId, activityId);
  }
}
*/

/**
 * EXEMPLE 2 : Intégrer dans ParticipationsService
 * ================================================
 */

// Dans src/participations/participations.service.ts
/*
export class ParticipationsService {
  constructor(
    private recommendationModelService: RecommendationModelService,
    // ... autres injections
  ) {}

  async enrollWithScore(userId: string, activityId: string) {
    // Calculer le score de prédiction
    const predictedScore = await this.recommendationModelService.predictScore(
      userId,
      activityId,
    );

    // Créer la participation avec la prédiction
    const participation = await this.participationModel.create({
      userId,
      activityId,
      status: 'started',
      predictedScore, // Nouveau champ optionnel
    });

    return participation;
  }
}
*/

/**
 * EXEMPLE 3 : Faire un batch de recommandations
 * ==============================================
 */

// Dans src/scoring/scoring.service.ts ou un nouveau controller
/*
export class RecommendationBatchService {
  constructor(
    private recommendationModelService: RecommendationModelService,
    private userModel: Model<User>,
  ) {}

  async recommendEmployeesForActivity(activityId: string, limit = 10) {
    const employees = await this.userModel.find({ role: 'EMPLOYEE' });

    const recommendations = await Promise.all(
      employees.map(async (emp) => ({
        employeeId: emp._id,
        name: emp.name,
        email: emp.email,
        score: await this.recommendationModelService.predictScore(
          emp._id.toString(),
          activityId,
        ),
      }))
    );

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
*/

/**
 * EXEMPLE 4 : Intégrer dans le Frontend (DataStore)
 * ==================================================
 */

// Dans lib/data-store.jsx ou components/recommendations/recommendation-engine.jsx
/*
const generateRecommendations = async (activity) => {
  try {
    // Appel au backend endpoints (à créer)
    const response = await api.get(
      `/api/scoring/activity/${activity._id}/recommendations?limit=10`
    );

    return response.data; // [{ employeeId, name, email, score, ... }]
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
};

// Utilisation
const recs = await generateRecommendations(selectedActivity);
setRecommendedEmployees(
  recs.sort((a, b) => b.score - a.score).map(r => ({
    ...r,
    recommendation: r.score >= 0.85 ? 'Top Pick' : r.score >= 0.7 ? 'Qualified' : 'Recommended'
  }))
);
*/

/**
 * EXEMPLE 5 : Tester avec curl
 * =============================
 */

/*
# Une fois les endpoints intégrés dans le controller :

# Prédiction simple
curl -X POST \
  http://localhost:3000/api/scoring/user123/predict/activity456 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Obtenir le détail
curl -X GET \
  http://localhost:3000/api/scoring/user123/breakdown/activity456 \
  -H "Authorization: Bearer YOUR_TOKEN"

# Recommandations pour une activité
curl -X GET \
  http://localhost:3000/api/scoring/activity456/recommendations?limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
*/

/**
 * EXEMPLE 6 : Configuration des poids
 * ====================================
 */

// Si vous voulez rendre les poids configurables, créer dans src/scoring/scoring.config.ts
/*
export const RECOMMENDATION_WEIGHTS = {
  SKILL_MATCH: 0.5,    // 50%
  EXPERIENCE: 0.2,     // 20%
  PROGRESSION: 0.2,    // 20%
  PERFORMANCE: 0.1,    // 10%
};

// Puis dans recommendation-model.service.ts
import { RECOMMENDATION_WEIGHTS } from './scoring.config';

const score =
  skillMatch * RECOMMENDATION_WEIGHTS.SKILL_MATCH +
  experience * RECOMMENDATION_WEIGHTS.EXPERIENCE +
  progression * RECOMMENDATION_WEIGHTS.PROGRESSION +
  performance * RECOMMENDATION_WEIGHTS.PERFORMANCE;
*/

/**
 * ÉTAT ACTUEL
 * ===========
 ✅ Service créé : src/scoring/recommendation-model.service.ts
 ✅ Module mis à jour : src/scoring/scoring.module.ts
 ✅ Compilation vérifiée : npm run build (exit code 0)
 ✅ Documentation complète : src/scoring/RECOMMENDATION_MODEL.md
 ⏳ À faire : Intégration dans les endpoints (pas encore fait)
 ⏳ À faire : Tests unitaires (optionnel)
 ⏳ À faire : Configuration des poids (optionnel)
 */

export {};
