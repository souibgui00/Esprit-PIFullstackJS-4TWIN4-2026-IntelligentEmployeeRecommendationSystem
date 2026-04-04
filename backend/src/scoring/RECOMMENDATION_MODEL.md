# RecommendationModelService

## Description

Service interne de modélisation des recommandations pour prédire la compatibilité utilisateur-activité basée sur plusieurs facteurs intelligents.

**Fichier** : `src/scoring/recommendation-model.service.ts`  
**Module** : `ScoringModule`

---

## Fonctionnalités

### 1. Fonction principale : `predictScore(userId, activityId)`

Prédit un score de compatibilité (0 à 1) entre un utilisateur et une activité.

#### Formule de calcul :

```
score = (skill_match × 0.5) + (experience × 0.2) + (progression × 0.2) + (performance × 0.1)
```

#### Composantes :

| Composante | Calcul | Poids | Description |
|------------|--------|-------|-------------|
| **skill_match** | 1 - (gaps.length / requiredSkills.length) | 50% | Ratio de compétences présentes vs requises |
| **experience** | min(yearsOfExperience / 10, 1) | 20% | Expérience normalisée à 10 ans |
| **progression** | avg(skills.progression) / 100 | 20% | Progression moyenne des compétences |
| **performance** | avg(skills.score) / 100 | 10% | Performance moyenne des compétences |

#### Exemple d'utilisation :

```typescript
// Injecter le service
constructor(private recommendationModelService: RecommendationModelService) {}

// Utiliser la fonction
const score = await this.recommendationModelService.predictScore(
  userId,    // ObjectId ou string
  activityId // ObjectId ou string
);

console.log(`Score de compatibilité : ${(score * 100).toFixed(2)}%`); // ex: 75.50%
```

---

### 2. Fonction utilitaire : `getScoreBreakdown(userId, activityId)`

Retourne le score global ET le détail de chaque composante pour transparence et debug.

#### Response :

```typescript
{
  overallScore: 0.755,
  components: {
    skillMatch: 0.8,      // 80%
    experience: 1.0,      // 100%
    progression: 0.65,    // 65%
    performance: 0.72     // 72%
  }
}
```

#### Exemple :

```typescript
const breakdown = await this.recommendationModelService.getScoreBreakdown(userId, activityId);

console.log(`Score global : ${(breakdown.overallScore * 100).toFixed(2)}%`);
console.log(`- Correspondance compétences : ${(breakdown.components.skillMatch * 100).toFixed(2)}%`);
console.log(`- Expérience : ${(breakdown.components.experience * 100).toFixed(2)}%`);
console.log(`- Progression : ${(breakdown.components.progression * 100).toFixed(2)}%`);
console.log(`- Performance : ${(breakdown.components.performance * 100).toFixed(2)}%`);
```

---

## Détails des composantes

### Skill Match (50%)
Utilise `PrioritizationService.identifySkillGaps()` pour identifier les lacunes et les soustraire du ratio.

```
skillMatch = 1 - (gaps.length / requiredSkills.length)
```

- **Valeur max** : 1 (toutes compétences présentes)
- **Valeur min** : 0 (aucune compétence correspondante)

---

### Experience (20%)
Basée sur `user.yearsOfExperience`, cappée à 1 (10+ ans = 100%).

```
experience = min(yearsOfExperience / 10, 1)
```

- 1 an = 10%
- 5 ans = 50%
- 10+ ans = 100%

---

### Progression (20%)
Moyenne de `user.skills[].progression` normalisée à 100%.

```
progression = sum(skills.progression) / count(skills) / 100
```

Assume que `progression` est un nombre 0-100 dans la base de données.

---

### Performance (10%)
Moyenne de `user.skills[].score` normalisée à 100%.

```
performance = sum(skills.score) / count(skills) / 100
```

- Min : 0
- Max : 1 (si tous les skills ont score = 100)

---

## Cas d'usage

### 1. Générer des recommandations par batch

```typescript
async generateRecommendations(activityId: string) {
  const activity = await this.activityModel.findById(activityId);
  const users = await this.userModel.find({ role: 'EMPLOYEE' });

  const scores = await Promise.all(
    users.map(async (user) => ({
      userId: user._id,
      name: user.name,
      score: await this.recommendationModelService.predictScore(
        user._id.toString(),
        activityId,
      ),
    }))
  );

  // Trier par score décroissant
  return scores.sort((a, b) => b.score - a.score);
}
```

### 2. Filtrer les candidats viables

```typescript
async getQualifiedCandidates(activityId: string, minScore = 0.5) {
  const recommendations = await this.generateRecommendations(activityId);
  return recommendations.filter((r) => r.score >= minScore);
}
```

### 3. Afficher le détail pour l'administrateur

```typescript
async getRecommendationWithAnalysis(userId: string, activityId: string) {
  const score = await this.recommendationModelService.predictScore(userId, activityId);
  const breakdown = await this.recommendationModelService.getScoreBreakdown(userId, activityId);

  return {
    score,
    breakdown,
    recommendation: this.getRecommendationLabel(score),
  };
}

private getRecommendationLabel(score: number): string {
  if (score >= 0.85) return 'Top Pick';
  if (score >= 0.70) return 'Qualified';
  if (score >= 0.50) return 'Recommended';
  return 'Consider';
}
```

---

## Intégration future

Le service est prêt pour intégration dans :

1. **ScoringController** - Endpoints `/api/scoring/predict` et `/api/scoring/breakdown`
2. **RecommendationController** - Recommandations filtrées et triées
3. **AssignmentService** - Calcul automatique des scores lors de la création d'assignment
4. **AdminApp UI** - Affichage des scores dans les pages de recommandation

---

## Notes

- **Pas de modification apportée** aux autres services (ScoringService, PrioritizationService, UsersService, etc.)
- **Code simple** : aucune dépendance externe, utilise uniquement Mongoose et NestJS
- **Testé** : compilation vérifiée avec `npm run build`
- **Extensible** : les poids (0.5, 0.2, 0.2, 0.1) peuvent être configurables dans `scoring.config.ts` si besoin

---

## Points clés à retenir

1. Le service retourne toujours un score **entre 0 et 1**
2. Il utilise `PrioritizationService.identifySkillGaps()` pour l'analyse des compétences
3. Tous les calculs sont **synchrones** (pas d'async sauf les requêtes DB)
4. Le service valide l'existence de l'utilisateur et de l'activité avant calcul
5. Le point `getScoreBreakdown()` expose chaque composante pour transparence
