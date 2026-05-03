from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List, Optional
import numpy as np
import pandas as pd
import joblib
import json
import os

# ──────────────────────────────────────────────────────────────────────────────
# App & Model Setup
# ──────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="NLP Recommendation Service",
    version="4.0.0",
    description="Hybrid NLP + Random Forest recommendation engine trained on real HR dataset."
)

print("Loading Sentence-BERT model...")
nlp_model = SentenceTransformer("all-MiniLM-L6-v2")
print("Sentence-BERT loaded!")

print("Loading Random Forest model...")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
rf_model      = joblib.load(os.path.join(BASE_DIR, "rf_model_hr.pkl"))
with open(os.path.join(BASE_DIR, "feature_names_hr.json")) as f:
    feature_names = json.load(f)
print(f"Random Forest HR loaded! Features: {feature_names}")

# ──────────────────────────────────────────────────────────────────────────────
# Pre-compute skill embeddings at startup
# ──────────────────────────────────────────────────────────────────────────────
DEFAULT_KNOWN_SKILLS = [
    "React", "TypeScript", "JavaScript", "Angular", "Vue", "Node.js",
    "NestJS", "Python", "FastAPI", "Django", "Flask", "Java", "Spring Boot",
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "Docker", "Kubernetes",
    "AWS", "Azure", "Git", "Linux", "CSS", "HTML", "GraphQL", "REST",
    "Agile", "Scrum", "Leadership", "Communication", "Public Speaking",
    "Project Management", "Data Analysis", "Machine Learning", "SQL",
    "Express", "C++", "C#", "Stress Management", "Teamwork", "Excel",
    "PowerPoint", "Jenkins", "CI/CD", "DevOps", "Figma", "UX", "UI",
    "Cybersecurity", "Financial Analysis", "Budgeting", "Tailwind CSS",
    "Time Management", "Problem Solving", "Decision-Making", "Digital Marketing",
    "Google Analytics", "AI", "Productivity",
]

print("Pre-computing skill embeddings...")
DEFAULT_SKILL_EMBEDDINGS = nlp_model.encode(
    [s.lower() for s in DEFAULT_KNOWN_SKILLS],
    normalize_embeddings=True,
    batch_size=64,
    show_progress_bar=False,
)
print(f"Pre-computed {len(DEFAULT_KNOWN_SKILLS)} skill embeddings!")

# ──────────────────────────────────────────────────────────────────────────────
# Bilingual sentiment anchors (English + French)
# ──────────────────────────────────────────────────────────────────────────────
POSITIVE_ANCHORS = [
    "this is excellent and very positive",
    "great work and amazing outcome",
    "i am happy and very satisfied with the results",
    "excellent collaboration and successful delivery",
    "outstanding performance and strong engagement",
    "highly motivated and professional",
    "excellent travail et très bonne performance",
    "résultats remarquables et collaboration exemplaire",
    "très satisfait de l'engagement et du sérieux",
    "travail de qualité et implication professionnelle",
    "formation très enrichissante et bien organisée",
    "compétences solides et grande motivation",
]

NEGATIVE_ANCHORS = [
    "this is very bad and negative outcome",
    "terrible result and very disappointing performance",
    "i am frustrated and angry about this",
    "poor quality and problematic delivery",
    "lack of engagement and motivation",
    "unsatisfactory results and weak performance",
    "résultats très décevants et manque d'engagement",
    "mauvaise performance et problèmes de communication",
    "formation peu utile et mal organisée",
    "manque de sérieux et de professionnalisme",
    "très insatisfait des résultats obtenus",
    "travail insuffisant et objectifs non atteints",
]

POSITIVE_ANCHOR_EMB = nlp_model.encode(POSITIVE_ANCHORS, normalize_embeddings=True)
NEGATIVE_ANCHOR_EMB = nlp_model.encode(NEGATIVE_ANCHORS, normalize_embeddings=True)

POSITIVE_WORDS = {
    "good", "great", "excellent", "awesome", "love", "nice", "perfect",
    "happy", "amazing", "outstanding", "fantastic", "superb", "brilliant",
    "efficient", "productive", "motivated", "engaged", "professional",
    "clear", "helpful", "useful", "effective", "successful", "satisfied",
    "bien", "super", "bravo", "merci", "parfait", "genial", "heureux",
    "top", "cool", "excellent", "remarquable", "satisfaisant", "enrichissant",
    "utile", "efficace", "motivant", "professionnel", "competent", "serieux",
    "implique", "dynamique", "clair", "organise", "positif", "progressif",
    "amelioration", "reussi", "accompli", "valorisant", "instructif",
}

NEGATIVE_WORDS = {
    "bad", "poor", "awful", "hate", "terrible", "bug", "issue", "problem",
    "angry", "frustrated", "disappointing", "unsatisfactory", "weak",
    "inefficient", "unclear", "confusing", "missing", "lacking", "failed",
    "slow", "boring", "irrelevant", "useless", "difficult", "complicated",
    "mauvais", "nul", "horrible", "erreur", "probleme", "lent", "decu",
    "triste", "mediocre", "insuffisant", "manque", "absent", "incomplet",
    "inorganise", "confus", "inutile", "decevant", "negatif", "echec",
    "difficile", "complique", "bloque", "inefficace", "insatisfaisant",
    "demotive", "desorganise", "inapproprie", "inadapte", "frustrant",
}

NEGATIONS    = {"not", "never", "no", "none", "pas", "jamais", "aucun", "rien", "ni", "sans"}
INTENSIFIERS = {"very", "extremely", "so", "highly", "tres", "vraiment", "trop", "super",
                "absolument", "particulierement", "totalement", "entierement"}

# ──────────────────────────────────────────────────────────────────────────────
# Department code → numeric mapping (matches dataset Dept_Code_enc)
# ──────────────────────────────────────────────────────────────────────────────
DEPT_CODE_ENC = {
    "ADM": 0, "BD": 1, "CA": 2, "COM": 3, "CS": 4,
    "DA": 5, "FIN": 6, "HR": 7, "IT": 8, "LEG": 9,
    "LOG": 10, "MKT": 11, "OPS": 12, "PM": 13, "PRO": 14,
    "QA": 15, "RND": 16, "SAL": 17, "STR": 18, "TRN": 19,
}

# Competence type keywords → which Comp_* flag to set
SKILL_TYPE_MAP = {
    # Innovation
    "innovation": "Comp_Innovation", "creative": "Comp_Innovation",
    "design thinking": "Comp_Innovation", "r&d": "Comp_Innovation",
    # Hard / Technical
    "javascript": "Comp_Hard", "python": "Comp_Hard", "java": "Comp_Hard",
    "sql": "Comp_Hard", "docker": "Comp_Hard", "react": "Comp_Hard",
    "node": "Comp_Hard", "typescript": "Comp_Hard", "aws": "Comp_Hard",
    "git": "Comp_Hard", "html": "Comp_Hard", "css": "Comp_Hard",
    "c++": "Comp_Hard", "spring": "Comp_Hard", "mongodb": "Comp_Hard",
    "nestjs": "Comp_Hard", "devops": "Comp_Hard", "kubernetes": "Comp_Hard",
    "cybersecurity": "Comp_Technical", "security": "Comp_Technical",
    "redis": "Comp_Technical", "graphql": "Comp_Technical",
    # Soft
    "communication": "Comp_Soft", "teamwork": "Comp_Soft",
    "leadership": "Comp_Soft", "public speaking": "Comp_Soft",
    "time management": "Comp_Soft", "problem solving": "Comp_Soft",
    "decision": "Comp_Soft", "stress": "Comp_Soft",
    # Digital
    "digital": "Comp_Digital", "ai": "Comp_Digital",
    "machine learning": "Comp_Digital", "data": "Comp_Digital",
    "analytics": "Comp_Digital", "power bi": "Comp_Digital",
    "google analytics": "Comp_Digital", "excel": "Comp_Digital",
    # Business
    "agile": "Comp_Business", "scrum": "Comp_Business",
    "project management": "Comp_Business", "budgeting": "Comp_Business",
    "financial": "Comp_Business", "marketing": "Comp_Business",
    "sales": "Comp_Business", "strategy": "Comp_Business",
    # Technical
    "technical": "Comp_Technical", "engineering": "Comp_Technical",
    "architecture": "Comp_Technical", "infrastructure": "Comp_Technical",
    # Customer
    "customer": "Comp_Customer", "service": "Comp_Customer",
    "support": "Comp_Customer", "crm": "Comp_Customer",
    # Managerial
    "management": "Comp_Managerial", "manager": "Comp_Managerial",
    "coordination": "Comp_Managerial", "planning": "Comp_Managerial",
    "productivity": "Comp_Managerial",
}

# ──────────────────────────────────────────────────────────────────────────────
# Pydantic Models
# ──────────────────────────────────────────────────────────────────────────────

class EmployeeData(BaseModel):
    userId: str
    name: str
    position: str = ""
    jobDescription: str = ""
    skills: List[str] = []
    age: Optional[int] = 30
    department: Optional[str] = "IT"           # Dept_Code (e.g. "IT", "HR", "FIN")
    jobRole: Optional[str] = "Employee"
    yearsAtCompany: Optional[float] = 2.0      # Anciennete_Ans
    performanceRating: Optional[int] = 3
    monthlyIncome: Optional[float] = 50000
    jobSatisfaction: Optional[int] = 3
    jobInvolvement: Optional[int] = 3
    education: Optional[int] = 3
    score: Optional[float] = 50.0              # rankScore from MongoDB (0–120)
    isActive: Optional[bool] = True            # Statut_bin

class ActivityData(BaseModel):
    activityId: str
    title: str
    description: str = ""
    requiredSkills: List[str] = []

class RecommendRequest(BaseModel):
    activity: ActivityData
    employees: List[EmployeeData]
    intent: str = "balanced"
    limit: Optional[int] = 10

class EmployeeScore(BaseModel):
    userId: str
    nlpScore: float
    rfScore: float
    finalScore: float
    reasoning: Optional[str] = None
    needsDevelopment: Optional[List[str]] = []

class RecommendResponse(BaseModel):
    activityId: str
    scores: List[EmployeeScore]

class SkillExtractionRequest(BaseModel):
    description: str
    title: str = ""
    knownSkills: Optional[List[str]] = None

class SkillExtractionResponse(BaseModel):
    extractedSkills: List[str]
    confidence: float

class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    label: str
    score: float
    confidence: float

class BatchSentimentRequest(BaseModel):
    texts: List[str]

class BatchSentimentResponse(BaseModel):
    results: List[SentimentResponse]
    averageScore: float
    dominantLabel: str

# ──────────────────────────────────────────────────────────────────────────────
# Core Utilities
# ──────────────────────────────────────────────────────────────────────────────

def build_activity_text(activity: ActivityData) -> str:
    skills_text = " ".join(activity.requiredSkills)
    return f"{activity.title} {activity.description} {skills_text}".strip()


def build_employee_text(employee: EmployeeData) -> str:
    skills_text = " ".join(employee.skills)
    return f"{employee.position} {employee.jobDescription} {skills_text}".strip()


def skills_to_comp_flags(skills: List[str]) -> dict:
    """
    Convert an employee's skill name list into Comp_* binary flags.
    Matches the dataset columns: Comp_Innovation, Comp_Hard, Comp_Soft,
    Comp_Digital, Comp_Business, Comp_Technical, Comp_Customer, Comp_Managerial.
    """
    flags = {
        "Comp_Innovation": 0, "Comp_Hard": 0, "Comp_Soft": 0,
        "Comp_Digital": 0, "Comp_Business": 0, "Comp_Technical": 0,
        "Comp_Customer": 0, "Comp_Managerial": 0,
    }
    for skill in skills:
        skill_lower = skill.lower()
        for keyword, comp_key in SKILL_TYPE_MAP.items():
            if keyword in skill_lower:
                flags[comp_key] = 1
                break
    return flags


def get_rf_score(employee: EmployeeData) -> float:
    """
    Build features matching the dataset columns used to train rf_model_hr.pkl:
    [Anciennete_Ans, N_Competences_Total, N_Comp_Types, Comp_Innovation,
     Comp_Hard, Comp_Soft, Comp_Digital, Comp_Business, Comp_Technical,
     Comp_Customer, Comp_Managerial, Dept_Code_enc, Statut_bin]
    """
    try:
        skills     = employee.skills or []
        years      = max(0.0, float(employee.yearsAtCompany or 2.0))
        dept_code  = (employee.department or "IT").upper()
        is_active  = 1 if (employee.isActive is not False) else 0

        # Competence flags from skill list
        comp_flags = skills_to_comp_flags(skills)

        # N_Competences_Total: number of skills the employee has
        n_total = len(skills)

        # N_Comp_Types: how many different comp categories they have
        n_types = sum(1 for v in comp_flags.values() if v == 1)

        # Dept_Code_enc
        dept_enc = DEPT_CODE_ENC.get(dept_code, DEPT_CODE_ENC.get("IT", 8))

        row = {
            'Anciennete_Ans':      years,
            'N_Competences_Total': n_total,
            'N_Comp_Types':        n_types,
            'Comp_Innovation':     comp_flags['Comp_Innovation'],
            'Comp_Hard':           comp_flags['Comp_Hard'],
            'Comp_Soft':           comp_flags['Comp_Soft'],
            'Comp_Digital':        comp_flags['Comp_Digital'],
            'Comp_Business':       comp_flags['Comp_Business'],
            'Comp_Technical':      comp_flags['Comp_Technical'],
            'Comp_Customer':       comp_flags['Comp_Customer'],
            'Comp_Managerial':     comp_flags['Comp_Managerial'],
            'Dept_Code_enc':       dept_enc,
            'Statut_bin':          is_active,
        }

        features = pd.DataFrame([row])[feature_names]
        prob     = rf_model.predict_proba(features)[0][1]

        # Temperature scaling to spread distribution
        prob  = max(1e-6, min(1 - 1e-6, prob))
        logit = np.log(prob / (1.0 - prob)) / 1.3
        return float(1.0 / (1.0 + np.exp(-logit)))

    except Exception as e:
        print(f"RF scoring error: {e}")
        return 0.5

# ──────────────────────────────────────────────────────────────────────────────
# Sentiment helpers
# ──────────────────────────────────────────────────────────────────────────────

def lexical_sentiment_score(text: str) -> float:
    tokens = [t.strip(".,!?;:()[]{}\"'`).,-_").lower() for t in text.split()]
    score  = 0.0
    for i, tok in enumerate(tokens):
        if not tok:
            continue
        base = 0.0
        if tok in POSITIVE_WORDS:
            base = 1.0
        elif tok in NEGATIVE_WORDS:
            base = -1.0
        if base == 0.0:
            continue
        prev  = tokens[i - 1] if i > 0 else ""
        prev2 = tokens[i - 2] if i > 1 else ""
        if prev in NEGATIONS or prev2 in NEGATIONS:
            base *= -1.0
        if prev in INTENSIFIERS or prev2 in INTENSIFIERS:
            base *= 1.4
        score += base
    if not tokens:
        return 0.0
    return float(max(-1.0, min(1.0, score / max(3.0, len(tokens) * 0.35))))


def semantic_sentiment_score(text: str) -> float:
    if not text.strip():
        return 0.0
    text_emb = nlp_model.encode(text, normalize_embeddings=True)
    pos_sim  = float(np.mean(np.dot(POSITIVE_ANCHOR_EMB, text_emb)))
    neg_sim  = float(np.mean(np.dot(NEGATIVE_ANCHOR_EMB, text_emb)))
    raw      = pos_sim - neg_sim
    return float(max(-1.0, min(1.0, raw * 2.0)))


def score_to_label(score: float) -> str:
    if score > 0.15:  return "positive"
    if score < -0.15: return "negative"
    return "neutral"


def _analyze_single(text: str) -> SentimentResponse:
    text = (text or "").strip()
    if not text:
        return SentimentResponse(label="neutral", score=0.0, confidence=0.0)
    semantic    = semantic_sentiment_score(text)
    lexical     = lexical_sentiment_score(text)
    final_score = float(max(-1.0, min(1.0, (0.7 * semantic) + (0.3 * lexical))))
    agreement   = 1.0 - abs(semantic - lexical) / 2.0
    confidence  = float(max(0.05, min(1.0, abs(final_score) * 0.7 + agreement * 0.3)))
    return SentimentResponse(
        label=score_to_label(final_score),
        score=round(final_score, 4),
        confidence=round(confidence, 4),
    )

# ──────────────────────────────────────────────────────────────────────────────
# API Endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "4.0.0",
        "models": {"nlp": "all-MiniLM-L6-v2", "rf": "RandomForest-HR-v4"},
        "rf_features": feature_names,
        "rf_accuracy": "98.3%",
        "rf_auc": "0.9993",
    }


@app.get("/model-info")
def model_info():
    return {
        "version": "4.0.0",
        "nlp_model": "sentence-transformers/all-MiniLM-L6-v2",
        "rf_model": "rf_model_hr.pkl — trained on real 1500-employee HR dataset",
        "rf_features": feature_names,
        "rf_accuracy": "98.3%",
        "rf_auc_roc":  "0.9993",
        "rf_cv_mean":  "97.5% ±0.96%",
        "training_dataset": {
            "rows": 1500,
            "target": "good_candidate = active AND N_Comp_Validated>=5 AND N_Comp_Types>=4",
            "top_features": ["Comp_Digital", "Comp_Business", "Comp_Managerial", "Comp_Hard"],
        },
        "feature_mapping": {
            "Anciennete_Ans":      "employee.yearsAtCompany",
            "N_Competences_Total": "len(employee.skills)",
            "N_Comp_Types":        "number of unique skill categories",
            "Comp_*":              "binary flags derived from skill names",
            "Dept_Code_enc":       "encoded from employee.department",
            "Statut_bin":          "employee.isActive (1=active, 0=inactive)",
        },
    }


@app.post("/recommend", response_model=RecommendResponse)
def recommend(request: RecommendRequest):
    """
    Batch SBERT encoding + RF scoring.
    RF model now trained on real dataset — no more label encoders needed.
    """
    if not request.employees:
        return RecommendResponse(activityId=request.activity.activityId, scores=[])

    activity_text      = build_activity_text(request.activity)
    activity_embedding = nlp_model.encode(activity_text, normalize_embeddings=True)

    employee_texts = [build_employee_text(e) for e in request.employees]
    valid_mask     = [bool(t.strip()) for t in employee_texts]
    texts_to_encode = [t for t, v in zip(employee_texts, valid_mask) if v]

    if texts_to_encode:
        all_embeddings   = nlp_model.encode(
            texts_to_encode, batch_size=64,
            normalize_embeddings=True, show_progress_bar=False,
        )
        raw_similarities = np.dot(all_embeddings, activity_embedding)
    else:
        raw_similarities = np.array([])

    scores    = []
    valid_idx = 0

    for i, employee in enumerate(request.employees):
        if valid_mask[i]:
            raw_nlp    = float(max(0.0, min(1.0, raw_similarities[valid_idx])))
            valid_idx += 1
        else:
            raw_nlp = 0.0

        # Intent-aware NLP adjustment
        if request.intent == "development":
            nlp_score = 1.0 - raw_nlp
        elif request.intent == "balanced":
            nlp_score = 0.5 + (0.5 - raw_nlp) * 0.4
        else:
            nlp_score = raw_nlp
        nlp_score = float(max(0.0, min(1.0, nlp_score)))

        rf_score = get_rf_score(employee)

        # Intent-aware blend
        if request.intent == "development":
            final_score = round(0.6 * nlp_score + 0.4 * rf_score, 4)
        elif request.intent == "performance":
            final_score = round(0.5 * nlp_score + 0.5 * rf_score, 4)
        else:
            final_score = round(0.55 * nlp_score + 0.45 * rf_score, 4)

        scores.append(EmployeeScore(
            userId=employee.userId,
            nlpScore=round(nlp_score, 4),
            rfScore=round(rf_score, 4),
            finalScore=final_score,
        ))

    scores.sort(key=lambda x: x.finalScore, reverse=True)
    
    # 5. Apply Limit
    if request.limit and request.limit > 0:
        scores = scores[:request.limit]

    # 6. Final Enrichment (Reasoning & Skill Gaps)
    # This ensures we return human-readable names and helpful feedback
    for score_obj in scores:
        emp = next(e for e in request.employees if e.userId == score_obj.userId)
        
        # Reasoning
        reason = f"Highly compatible for '{request.activity.title}'."
        if score_obj.nlpScore > 0.7:
            reason = f"Excellent skill alignment with {request.activity.title} requirements."
        elif score_obj.rfScore > 0.8:
            reason = "High success probability based on professional trajectory."
            
        score_obj.reasoning = reason
        
        # Skill Gaps (Human Readable)
        req_skills = [s.lower() for s in request.activity.requiredSkills]
        emp_skills = [s.lower() for s in emp.skills]
        gaps = [s.capitalize() for s in req_skills if s not in emp_skills]
        score_obj.needsDevelopment = gaps[:3]

    return RecommendResponse(activityId=request.activity.activityId, scores=scores)


@app.post("/extract-skills", response_model=SkillExtractionResponse)
def extract_skills(request: SkillExtractionRequest):
    text           = f"{request.title} {request.description}".strip()
    text_embedding = nlp_model.encode(text.lower(), normalize_embeddings=True)

    if request.knownSkills and len(request.knownSkills) > 0:
        skills_to_use    = request.knownSkills
        skill_embeddings = nlp_model.encode(
            [s.lower() for s in skills_to_use],
            normalize_embeddings=True, batch_size=64, show_progress_bar=False,
        )
    else:
        skills_to_use    = DEFAULT_KNOWN_SKILLS
        skill_embeddings = DEFAULT_SKILL_EMBEDDINGS

    similarities = np.dot(skill_embeddings, text_embedding)
    threshold    = 0.45
    paired       = [(float(sim), skill)
                    for sim, skill in zip(similarities, skills_to_use)
                    if float(sim) > threshold]
    paired.sort(reverse=True)
    top_skills   = [skill for _, skill in paired[:8]]
    avg_conf     = float(np.mean([s for s, _ in paired[:8]])) if paired else 0.0

    return SkillExtractionResponse(
        extractedSkills=top_skills,
        confidence=round(avg_conf, 4),
    )


@app.post("/analyze-sentiment", response_model=SentimentResponse)
def analyze_sentiment(request: SentimentRequest):
    return _analyze_single(request.text)


@app.post("/batch-sentiment", response_model=BatchSentimentResponse)
def batch_sentiment(request: BatchSentimentRequest):
    if not request.texts:
        return BatchSentimentResponse(results=[], averageScore=0.0, dominantLabel="neutral")
    results = [_analyze_single(text) for text in request.texts]
    scores  = [r.score for r in results]
    avg     = float(np.mean(scores))
    label_counts = {"positive": 0, "neutral": 0, "negative": 0}
    for r in results:
        label_counts[r.label] += 1
    dominant = max(label_counts, key=label_counts.get)
    return BatchSentimentResponse(
        results=results,
        averageScore=round(avg, 4),
        dominantLabel=dominant,
    )
