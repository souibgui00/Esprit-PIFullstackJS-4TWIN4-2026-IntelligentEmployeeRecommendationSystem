
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List, Optional
import numpy as np
import pandas as pd
import joblib
import json
import os

app = FastAPI(title="NLP Recommendation Service v2")

print("Loading Sentence-BERT model...")
nlp_model = SentenceTransformer("all-MiniLM-L6-v2")
print("Sentence-BERT loaded!")

print("Loading improved Random Forest model...")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
rf_model = joblib.load(os.path.join(BASE_DIR, "rf_model_v2.pkl"))
label_encoders = joblib.load(os.path.join(BASE_DIR, "label_encoders_v2.pkl"))
with open(os.path.join(BASE_DIR, "feature_names_v2.json")) as f:
    feature_names = json.load(f)
print("Random Forest v2 loaded!")

class EmployeeData(BaseModel):
    userId: str
    name: str
    position: str = ""
    jobDescription: str = ""
    skills: List[str] = []
    age: Optional[int] = 30
    department: Optional[str] = "General"
    jobRole: Optional[str] = "Employee"
    yearsAtCompany: Optional[int] = 2
    performanceRating: Optional[int] = 3
    monthlyIncome: Optional[float] = 50000
    jobSatisfaction: Optional[int] = 3
    jobInvolvement: Optional[int] = 3
    education: Optional[int] = 3
    score: Optional[float] = 50.0

class ActivityData(BaseModel):
    activityId: str
    title: str
    description: str = ""
    requiredSkills: List[str] = []

class RecommendRequest(BaseModel):
    activity: ActivityData
    employees: List[EmployeeData]
    intent: str = "balanced"  # 'development' | 'performance' | 'balanced'

class EmployeeScore(BaseModel):
    userId: str
    nlpScore: float
    rfScore: float
    finalScore: float

class RecommendResponse(BaseModel):
    activityId: str
    scores: List[EmployeeScore]

# New Skill Extraction Models
class SkillExtractionRequest(BaseModel):
    description: str
    title: str = ""

class SkillExtractionResponse(BaseModel):
    extractedSkills: List[str]
    confidence: float

class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    label: str
    score: float
    confidence: float

def cosine_similarity(vec1, vec2):
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(np.dot(vec1, vec2) / (norm1 * norm2))

POSITIVE_ANCHORS = [
    "this is excellent and very positive",
    "great work and amazing outcome",
    "i am happy and satisfied",
    "excellent collaboration and success",
]

NEGATIVE_ANCHORS = [
    "this is very bad and negative",
    "terrible result and disappointing",
    "i am frustrated and angry",
    "poor quality and problematic delivery",
]

POSITIVE_ANCHOR_EMB = nlp_model.encode(POSITIVE_ANCHORS)
NEGATIVE_ANCHOR_EMB = nlp_model.encode(NEGATIVE_ANCHORS)

POSITIVE_WORDS = {
    "good", "great", "excellent", "awesome", "love", "nice", "perfect", "happy", "amazing",
    "bien", "super", "bravo", "merci", "parfait", "genial", "heureux", "top", "cool",
}

NEGATIVE_WORDS = {
    "bad", "poor", "awful", "hate", "terrible", "bug", "issue", "problem", "angry",
    "mauvais", "nul", "horrible", "erreur", "probleme", "lent", "decu", "triste",
}

NEGATIONS = {"not", "never", "no", "pas", "jamais", "aucun", "rien"}

INTENSIFIERS = {"very", "extremely", "so", "tres", "vraiment", "trop", "super"}

def lexical_sentiment_score(text: str) -> float:
    tokens = [t.strip(".,!?;:()[]{}\"'`).-_").lower() for t in text.split()]
    score = 0.0

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

        prev = tokens[i - 1] if i > 0 else ""
        prev2 = tokens[i - 2] if i > 1 else ""

        if prev in NEGATIONS or prev2 in NEGATIONS:
            base *= -1.0

        if prev in INTENSIFIERS or prev2 in INTENSIFIERS:
            base *= 1.35

        score += base

    if not tokens:
        return 0.0

    return float(max(-1.0, min(1.0, score / max(3.0, len(tokens) * 0.35))))

def semantic_sentiment_score(text: str) -> float:
    if not text.strip():
        return 0.0

    text_emb = nlp_model.encode(text)
    pos_sim = float(np.mean([cosine_similarity(text_emb, emb) for emb in POSITIVE_ANCHOR_EMB]))
    neg_sim = float(np.mean([cosine_similarity(text_emb, emb) for emb in NEGATIVE_ANCHOR_EMB]))

    raw = pos_sim - neg_sim
    return float(max(-1.0, min(1.0, raw * 1.8)))

def score_to_label(score: float) -> str:
    if score > 0.2:
        return "positive"
    if score < -0.2:
        return "negative"
    return "neutral"

def build_activity_text(activity: ActivityData) -> str:
    skills_text = " ".join(activity.requiredSkills)
    return f"{activity.title} {activity.description} {skills_text}".strip()

def build_employee_text(employee: EmployeeData) -> str:
    skills_text = " ".join(employee.skills)
    return f"{employee.position} {employee.jobDescription} {skills_text}".strip()

def get_rf_score(employee: EmployeeData, nlp_score: float) -> float:
    try:
        def encode(col, val):
            if col in label_encoders:
                le = label_encoders[col]
                val_str = str(val)
                if val_str in le.classes_:
                    return le.transform([val_str])[0]
                return 0
            return val

        perf = employee.performanceRating or 3
        edu = employee.education or 3
        involvement = employee.jobInvolvement or 3
        score_val = employee.score or 50.0
        years = employee.yearsAtCompany or 2

        # Engineered features
        skill_match_ratio = min(1.0, (edu/5)*0.4 + (involvement/4)*0.3 + (score_val/100)*0.3)
        level_match_ratio = min(1.0, (perf/4)*0.5 + skill_match_ratio*0.5)
        experience_relevance = min(1.0, years / 21)
        performance_x_match = min(1.0, (perf/4) * skill_match_ratio)

        row = {
            'Age': employee.age or 30,
            'BusinessTravel': encode('BusinessTravel', 'Travel_Rarely'),
            'Department': encode('Department', employee.department or 'General'),
            'Education': edu,
            'EducationField': encode('EducationField', 'Other'),
            'YearsAtCompany': years,
            'JobInvolvement': involvement,
            'score': score_val,
            'JobRole': encode('JobRole', employee.jobRole or 'Employee'),
            'JobSatisfaction': employee.jobSatisfaction or 3,
            'PerformanceRating': perf,
            'skill_match_ratio': skill_match_ratio,
            'level_match_ratio': level_match_ratio,
            'experience_relevance': experience_relevance,
            'performance_x_match': performance_x_match,
            # Placeholder/Default values for other RF features
            'DistanceFromHome': 10,
            'Gender': encode('Gender', 'Male'),
            'MaritalStatus': encode('MaritalStatus', 'Single'),
            'MonthlyIncome': employee.monthlyIncome or 50000,
            'statut': encode('statut', 'active'),
            'salary': (employee.monthlyIncome or 50000) * 12,
            'competences': encode('competences', 'Technical Skills'),
        }

        features = pd.DataFrame([row])[feature_names]
        prob = rf_model.predict_proba(features)[0][1]
        return float(prob)
    except Exception as e:
        print(f"RF scoring error: {e}")
        return 0.5

@app.get("/health")
def health():
    return {"status": "ok", "model": "all-MiniLM-L6-v2 + RandomForest-v2"}

@app.post("/recommend", response_model=RecommendResponse)
def recommend(request: RecommendRequest):
    activity_text = build_activity_text(request.activity)
    activity_embedding = nlp_model.encode(activity_text)

    scores = []
    for employee in request.employees:
        employee_text = build_employee_text(employee)
        if employee_text.strip():
            emp_embedding = nlp_model.encode(employee_text)
            raw_nlp_score = max(0.0, min(1.0, cosine_similarity(activity_embedding, emp_embedding)))
        else:
            raw_nlp_score = 0.0

        # Intent-aware NLP score adjustment:
        # development → invert NLP score (low match = high need for this training)
        # performance → keep NLP score as-is (high match = best fit)
        # balanced    → soft inversion (slight preference for developing employees)
        if request.intent == "development":
            nlp_score = 1.0 - raw_nlp_score
        elif request.intent == "balanced":
            nlp_score = 0.5 + (0.5 - raw_nlp_score) * 0.4  # mild inversion
        else:
            nlp_score = raw_nlp_score  # performance: keep high = good

        nlp_score = max(0.0, min(1.0, nlp_score))
        rf_score = get_rf_score(employee, nlp_score)
        final_score = round((0.5 * nlp_score) + (0.5 * rf_score), 4)

        scores.append(EmployeeScore(
            userId=employee.userId,
            nlpScore=round(nlp_score, 4),
            rfScore=round(rf_score, 4),
            finalScore=final_score
        ))

    scores.sort(key=lambda x: x.finalScore, reverse=True)
    return RecommendResponse(activityId=request.activity.activityId, scores=scores)

@app.post("/extract-skills", response_model=SkillExtractionResponse)
def extract_skills(request: SkillExtractionRequest):
    # Known skills vocabulary to match against
    KNOWN_SKILLS = [
        "React", "TypeScript", "JavaScript", "Angular", "Vue", "Node.js",
        "NestJS", "Python", "FastAPI", "Django", "Flask", "Java", "Spring",
        "MongoDB", "PostgreSQL", "MySQL", "Redis", "Docker", "Kubernetes",
        "AWS", "Azure", "Git", "Linux", "CSS", "HTML", "GraphQL", "REST",
        "Agile", "Scrum", "Leadership", "Communication", "Public Speaking",
        "Project Management", "Data Analysis", "Machine Learning", "SQL",
        "Express", "C++", "C#", "Stress Management", "Teamwork", "Excel",
        "PowerPoint", "Jenkins", "CI/CD", "DevOps", "Figma", "UX", "UI"
    ]
    
    text = f"{request.title} {request.description}".lower()
    text_embedding = nlp_model.encode(text)
    
    matched_skills = []
    skill_scores = []
    
    for skill in KNOWN_SKILLS:
        skill_embedding = nlp_model.encode(skill.lower())
        similarity = cosine_similarity(text_embedding, skill_embedding)
        if similarity > 0.45:  # Strict confidence threshold to prevent false-positive grouping
            matched_skills.append(skill)
            skill_scores.append(similarity)
    
    paired = sorted(zip(skill_scores, matched_skills), reverse=True)
    top_skills = [skill for _, skill in paired[:8]]
    avg_confidence = float(np.mean([s for s, _ in paired[:8]])) if paired else 0.0
    
    return SkillExtractionResponse(
        extractedSkills=top_skills,
        confidence=round(avg_confidence, 4)
    )

@app.post("/analyze-sentiment", response_model=SentimentResponse)
def analyze_sentiment(request: SentimentRequest):
    text = (request.text or "").strip()
    if not text:
        return SentimentResponse(label="neutral", score=0.0, confidence=0.0)

    semantic = semantic_sentiment_score(text)
    lexical = lexical_sentiment_score(text)

    final_score = float(max(-1.0, min(1.0, (0.7 * semantic) + (0.3 * lexical))))
    confidence = float(max(0.05, min(1.0, abs(final_score) + abs(semantic - lexical) * 0.2)))

    return SentimentResponse(
        label=score_to_label(final_score),
        score=round(final_score, 4),
        confidence=round(confidence, 4),
    )
