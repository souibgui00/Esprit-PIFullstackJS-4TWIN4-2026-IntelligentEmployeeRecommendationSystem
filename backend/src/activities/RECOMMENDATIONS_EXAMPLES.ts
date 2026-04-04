/**
 * EXAMPLES D'UTILISATION - GET /activities/recommendations/:userId
 * ================================================================
 * Ce fichier contient des exemples de comment utiliser le nouvel endpoint
 * Tous les exemples sont documentés, pas du code executable
 */

// EXEMPLE 1: Appel simple avec curl
// ──────────────────────────────────
// curl -X GET \
//   http://localhost:3000/activities/recommendations/507f1f77bcf86cd799439030 \
//   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// EXEMPLE 2: Fetcher les recommandations en JavaScript
// ─────────────────────────────────────────────────────
// const fetchActivityRecommendations = async (userId) => {
//   try {
//     const response = await api.get(`/activities/recommendations/${userId}`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching recommendations:', error);
//     return [];
//   }
// };
// const recommendations = await fetchActivityRecommendations(userId);

// EXEMPLE 3: Filter & Analyze
// ────────────────────────────
// Utile pour filtrer et grouper les recommandations
// function filterRecommendationsByScore(recommendations, minScore = 0.6) {
//   return recommendations.filter((rec) => rec.score >= minScore);
// }
// function groupRecommendationsByGap(recommendations) {
//   const grouped = {};
//   recommendations.forEach((rec) => {
//     rec.gap.forEach((gap) => {
//       if (!grouped[gap.skillName]) {
//         grouped[gap.skillName] = [];
//       }
//       grouped[gap.skillName].push(rec);
//     });
//   });
//   return grouped;
// }
// const allRecs = await fetchActivityRecommendations(userId);
// const goodRecs = filterRecommendationsByScore(allRecs, 0.7);
// const gapsBySkill = groupRecommendationsByGap(allRecs);

export {};
