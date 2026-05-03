"""
HR Platform — MongoDB Mass Seeder (FIXED v2)
=============================================
Corrections applied vs original script:
  FIX 1:  skill.type enum corrected  → "technique" | "comportementale" | "transverse" | "opérationnelle"
  FIX 2:  Skills collection is now seeded FIRST so populate('skills.skillId') works
  FIX 3:  rank values corrected      → "Junior" | "Mid" | "Senior" | "Expert"
  FIX 4:  rankScore range corrected  → 0–120 (computed from real skill scores)
  FIX 5:  auto_eval / hierarchie_eval corrected → 0–100 scale (not 0–1)
  FIX 6:  skills[].etat corrected    → "draft" | "submitted" | "validated" (removed "in_progress", "completed")
  FIX 7:  activity workflowStatus   → "pending_approval" | "approved" | "rejected" (removed "completed")
  FIX 8:  activity status           → "open" | "closed" | "completed" (removed "cancelled")
  FIX 9:  activity date             → stored as STRING not datetime (matches schema @Prop required: string)
  FIX 10: skillsCovered + targetDepartments → stored as plain strings not ObjectIds
  FIX 11: assignment.type           → "direct_assignment" | "recommendation" (removed "manual")
  FIX 12: participation.feedback    → 0–10 scale (was 0–3, schema min:0 max:10)
  FIX 13: organizerRating           → 1–5 (schema min:1 max:5), only set on correct statuses

Usage:
    pip install pymongo pandas openpyxl
    python generate_and_seed_fixed.py
"""

import random
import hashlib
from datetime import datetime, timedelta, timezone
from bson import ObjectId
import pandas as pd
from pymongo import MongoClient, InsertOne
from pymongo.errors import BulkWriteError

# ══════════════════════════════════════════════════════════════
# CONFIG
# ══════════════════════════════════════════════════════════════
MONGO_URI     = "mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/"
DB_NAME       = "test"   # ← FIXED: matches MONGODB_URI in backend/.env (/test)
DATASET       = "dataset.xlsx"
PASSWORD_HASH = "$2b$10$Y1Q9tdCgdR.OSl2pHrlRUuIsI16VojYyIhpfE/2Fjl7M..JiHtkLe"

# ══════════════════════════════════════════════════════════════
# SKILL IDS — matches your real MongoDB Skills collection
# FIX 1: type values now use the real skill schema enum:
#         "technique" | "comportementale" | "transverse" | "opérationnelle"
# ══════════════════════════════════════════════════════════════
SKILL_IDS = [
    ("69a65d1524df5f8ade495ffa", "JavaScript",          "technique"),
    ("69a65d1524df5f8ade495ffb", "React",               "technique"),
    ("69a65d1524df5f8ade495ffc", "Node.js",             "technique"),
    ("69a65d1524df5f8ade495ffd", "Python",              "technique"),
    ("69a65d1524df5f8ade495ffe", "SQL",                 "technique"),
    ("69a65d1524df5f8ade495fff", "Project Management",  "transverse"),
    ("69a65d1524df5f8ade496000", "Communication",       "comportementale"),
    ("69a65d1524df5f8ade496001", "Docker",              "technique"),
    ("69a65d1524df5f8ade496002", "TypeScript",          "technique"),
    ("69a65d1624df5f8ade496003", "Tailwind CSS",        "technique"),
    ("69a65d1624df5f8ade496004", "Java",                "technique"),
    ("69a65d1624df5f8ade496005", "Spring Boot",         "technique"),
    ("69a65d1624df5f8ade496006", "MongoDB",             "technique"),
    ("69a65d1624df5f8ade496007", "Problem Solving",     "comportementale"),
    ("69a65d1624df5f8ade496008", "Teamwork",            "comportementale"),
    ("69c35744938667ce6c56f6f5", "C++",                 "technique"),
    ("69c35744938667ce6c56f6f6", "HTML",                "technique"),
    ("69c35744938667ce6c56f6f7", "CSS",                 "technique"),
    ("69c35744938667ce6c56f6fb", "Git",                 "technique"),
    ("69c35f9730e4aeb4c1d9ce93", "Financial Analysis",  "opérationnelle"),
    ("69c59177ec671da99c220529", "Agile",               "transverse"),
    ("69c653b47e89ef7640c18373", "Angular",             "technique"),
    ("69c653b57e89ef7640c18375", "Express",             "technique"),
    ("69c653b57e89ef7640c1837f", "AWS",                 "technique"),
    ("69c653b57e89ef7640c18385", "Scrum",               "transverse"),
    ("69c653b57e89ef7640c18387", "AI",                  "technique"),
    ("69d13572e78b2781b110441a", "Decision-Making",     "comportementale"),
    ("69d13584e78b2781b110441e", "Leadership",          "comportementale"),
    ("69d136eee78b2781b1104ac1", "Budgeting",           "opérationnelle"),
    ("69d1382de78b2781b1104b23", "Productivity",        "transverse"),
    ("69d13841e78b2781b1104b26", "Time Management",     "transverse"),
    ("69d137d0e78b2781b1104b06", "Cybersecurity",       "technique"),
    ("69c35f9730e4aeb4c1d9ce91", "Digital Marketing",   "opérationnelle"),
    ("69cbbb2d3602c81856ed2893", "Google Analytics",    "technique"),
]

# ── Skill type → category used by the USER scoring weights ─────────────────
# The scoring engine groups skills into: knowledge / knowhow / softskill
# Map from our real schema type → scoring category
SKILL_TYPE_TO_CATEGORY = {
    "technique":       "knowhow",
    "opérationnelle":  "knowledge",
    "transverse":      "softskill",
    "comportementale": "softskill",
}

# ══════════════════════════════════════════════════════════════
# DEPARTMENT + MANAGER CONFIG
# ══════════════════════════════════════════════════════════════
DEPT_CODE_MAP = {
    "HR":  "69a60e1d943f3dabdd8219e7",
    "FIN": "69a757ecae79cebaa3cc922a",
    "IT":  "69a908ca99f13c1d9ce26139",
    "STR": "69a757ecae79cebaa3cc922a",
    "MKT": "69a757ecae79cebaa3cc922a",
    "SAL": "69a757ecae79cebaa3cc922a",
    "OPS": "69a908ca99f13c1d9ce26139",
    "CS":  "69a908ca99f13c1d9ce26139",
    "RND": "69a908ca99f13c1d9ce26139",
    "LEG": "69a757ecae79cebaa3cc922a",
    "PRO": "69a908ca99f13c1d9ce26139",
    "QA":  "69a908ca99f13c1d9ce26139",
    "PM":  "69a757ecae79cebaa3cc922a",
    "BD":  "69a757ecae79cebaa3cc922a",
    "ADM": "69a60e1d943f3dabdd8219e7",
    "LOG": "69a908ca99f13c1d9ce26139",
    "TRN": "69a60e1d943f3dabdd8219e7",
    "COM": "69a757ecae79cebaa3cc922a",
    "DA":  "69a908ca99f13c1d9ce26139",
    "CA":  "69a757ecae79cebaa3cc922a",
}

MANAGER_IDS = [
    "69a610c3da349bb345989385",
    "69cfa92c15aaf16896699900",
    "69d561f7e4613e0304827c5d",
]

ACTIVITY_IDS = [
    "69d1358ee78b2781b1104421",
    "69d136a8e78b2781b1104aaf",
    "69d1370be78b2781b1104ac7",
    "69d13765e78b2781b1104ae0",
    "69d137f3e78b2781b1104b0c",
    "69d1384ce78b2781b1104b29",
    "69d4ded25c6d142b47237c61",
    "69d51afcc8ba9214741af74c",
    "69d51d01c8ba9214741afd68",
    "69d5873f31542d3fade35c37",
    "69d6434edb8863ded4ac0713",
]

hr_manager_id = "69a610c3da349bb345989385"

# ══════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════

def oid(hex_str=None):
    return ObjectId(hex_str) if hex_str else ObjectId()

def now():
    return datetime.now(timezone.utc)

def rand_date(start_year=2018, end_year=2025):
    start = datetime(start_year, 1, 1, tzinfo=timezone.utc)
    end   = datetime(end_year, 12, 31, tzinfo=timezone.utc)
    return start + timedelta(seconds=random.randint(0, int((end - start).total_seconds())))

def rand_date_2026():
    start = datetime(2026, 1, 1, tzinfo=timezone.utc)
    end   = datetime(2026, 4, 20, tzinfo=timezone.utc)
    return start + timedelta(seconds=random.randint(0, int((end - start).total_seconds())))

def rand_date_string_2026():
    """FIX 9: Activity date field is a STRING in the schema, not a Date object."""
    d = rand_date_2026()
    return d.strftime("%Y-%m-%d")

def avatar_url(name):
    h = hashlib.md5(name.encode()).hexdigest()
    return f"https://i.pravatar.cc/150?u={h}"

def bulk_insert(collection, docs, label):
    if not docs:
        print(f"  ⚠  {label}: nothing to insert")
        return
    inserted = skipped = 0
    for i in range(0, len(docs), 500):
        batch = docs[i:i+500]
        try:
            r = collection.bulk_write([InsertOne(d) for d in batch], ordered=False)
            inserted += r.inserted_count
        except BulkWriteError as e:
            inserted += e.details.get("nInserted", 0)
            skipped  += sum(1 for err in e.details.get("writeErrors", []) if err.get("code") == 11000)
    print(f"  ✓  {label}: {inserted} inserted, {skipped} skipped (duplicates)")


# ══════════════════════════════════════════════════════════════
# SCORING HELPERS — mirror the real NestJS scoring formula
# ══════════════════════════════════════════════════════════════

LEVEL_BASE = {"beginner": 25, "intermediate": 50, "advanced": 75, "expert": 100}

def compute_skill_score(level, years_exp, auto_eval_100, hier_eval_100, last_updated):
    """
    Mirrors scoring.service.ts formula:
      score = base + experience_bonus + progression_bonus + feedback_bonus
      max = 120
    """
    base = LEVEL_BASE.get(level, 25)

    # Experience bonus: min(years * 2, 20)
    exp_bonus = min(years_exp * 2, 20)

    # Progression bonus: 5 if updated within last 6 months
    six_months_ago = now() - timedelta(days=180)
    prog_bonus = 5 if last_updated > six_months_ago else 0

    # Feedback bonus: normalize 0-100 → 1-5, then (0.4*auto + 0.6*hier) * 2
    def norm(v):
        if v <= 0:
            return 0
        if v <= 5:
            return max(1, min(5, v))
        if v <= 10:
            return max(1, min(5, v / 2))
        return max(1, min(5, v / 20))

    feedback_bonus = (0.4 * norm(auto_eval_100) + 0.6 * norm(hier_eval_100)) * 2

    return min(round(base + exp_bonus + prog_bonus + feedback_bonus, 1), 120)


CATEGORY_WEIGHTS = {"knowledge": 0.5, "knowhow": 0.3, "softskill": 0.2}

def compute_rank_score(skills_list):
    """
    Mirrors UsersService.computeWeightedSkillScore():
      Weighted average across 3 skill categories.
    Returns (rankScore, rank_label)
    """
    category_scores = {"knowledge": [], "knowhow": [], "softskill": []}
    for s in skills_list:
        cat = s["_category"]
        category_scores[cat].append(s["score"])

    def avg(lst):
        return sum(lst) / len(lst) if lst else 0

    cat_avgs = {c: avg(v) for c, v in category_scores.items()}
    total_weight = 0
    weighted_sum = 0
    for cat, weight in CATEGORY_WEIGHTS.items():
        if category_scores[cat]:
            weighted_sum += cat_avgs[cat] * weight
            total_weight += weight

    rank_score = round(weighted_sum / total_weight, 1) if total_weight > 0 else 0

    # FIX 3 + FIX 4: correct rank labels and correct score range 0-120
    if rank_score > 95:
        rank = "Expert"
    elif rank_score > 75:
        rank = "Senior"
    elif rank_score > 45:
        rank = "Mid"
    else:
        rank = "Junior"

    return rank_score, rank


# ══════════════════════════════════════════════════════════════
# STEP 0 — Load dataset
# ══════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  Loading dataset.xlsx...")
print("="*60)

df = pd.read_excel(DATASET)
print(f"  {len(df)} rows, {df['Matricule'].nunique()} unique employees")
print(f"  Columns found: {list(df.columns)}")
emp_df = df.drop_duplicates('Matricule').copy()
# FIX: correct column name is Date_Embauche (underscore, not space)
emp_df['Date_Embauche'] = pd.to_datetime(emp_df['Date_Embauche'], errors='coerce')


# ══════════════════════════════════════════════════════════════
# STEP 1 — Build Skills documents
# FIX 2: Seed Skills collection FIRST so populate() works
# FIX 1: Use correct skill.type enum values
# ══════════════════════════════════════════════════════════════
print("\n  Building skills collection...")

skill_docs = []
for sid, sname, stype in SKILL_IDS:
    skill_docs.append({
        "_id":            oid(sid),
        "name":           sname,
        "type":           stype,             # FIX 1: real enum values
        "etat":           "validated",
        "description":    f"Competency in {sname}.",
        "category":       SKILL_TYPE_TO_CATEGORY.get(stype, "knowledge"),
        "auto_eval":      0,
        "hierarchie_eval":0,
        "createdAt":      now(),
        "updatedAt":      now(),
        "__v":            0,
    })

skill_ids_list = [s[0] for s in SKILL_IDS]
skill_type_map = {s[0]: s[2] for s in SKILL_IDS}
print(f"  {len(skill_docs)} skill documents built")


# ══════════════════════════════════════════════════════════════
# STEP 2 — Generate Users
# FIX 3: rank = Junior/Mid/Senior/Expert
# FIX 4: rankScore computed from real formula (0–120)
# FIX 5: auto_eval / hierarchie_eval = 0–100
# FIX 6: skills[].etat = draft | submitted | validated only
# ══════════════════════════════════════════════════════════════
print("  Generating users...")

# FIX 6: valid etat values only
VALID_SKILL_ETAT = ["draft", "submitted", "validated"]

def make_user_skills(years_exp, n_skills=None, etat_weights=None):
    if n_skills is None:
        n_skills = random.randint(20, 25)  # Increased min to 20 for more skills
    if etat_weights is None:
        etat_weights = [30, 30, 40]
    
    # Group skills by type
    skills_by_type = {
        "technique": [sid for sid, _, stype in SKILL_IDS if stype == "technique"],
        "comportementale": [sid for sid, _, stype in SKILL_IDS if stype == "comportementale"],
        "transverse": [sid for sid, _, stype in SKILL_IDS if stype == "transverse"],
        "opérationnelle": [sid for sid, _, stype in SKILL_IDS if stype == "opérationnelle"],
    }
    
    # Guarantee at least 1 skill from each type
    chosen = []
    for t, sids in skills_by_type.items():
        chosen.append(random.choice(sids))
    
    # Fill the rest randomly to reach n_skills
    remaining = n_skills - len(chosen)
    if remaining > 0:
        all_available = [sid for sid in skill_ids_list if sid not in chosen]
        if all_available:
            chosen.extend(random.sample(all_available, min(remaining, len(all_available))))
    
    skills = []
    for sid in chosen:
        level        = random.choice(["beginner", "intermediate", "advanced", "expert"])
        auto_eval    = random.randint(0, 100)
        hier_eval    = random.randint(0, 100)
        last_updated = rand_date_2026()
        score        = compute_skill_score(level, years_exp, auto_eval, hier_eval, last_updated)
        stype        = skill_type_map.get(sid, "technique")
        category     = SKILL_TYPE_TO_CATEGORY.get(stype, "knowledge")

        skills.append({
            "_id":             oid(),
            "skillId":         oid(sid),
            "level":           level,
            "score":           score,
            "auto_eval":       auto_eval,
            "hierarchie_eval": hier_eval,
            "progression":     round(random.uniform(0, 1), 2),
            "etat":            random.choices(VALID_SKILL_ETAT, weights=etat_weights)[0],
            "lastUpdated":     last_updated,
            "_category":       category,
        })
    return skills

users_to_insert = []
user_id_map = {}

positions_by_dept = {
    "HR":  ["HR Specialist", "Recruiter", "HR Coordinator", "Talent Manager"],
    "FIN": ["Financial Analyst", "Accountant", "Budget Manager", "Controller"],
    "IT":  ["Software Engineer", "DevOps Engineer", "Data Scientist", "QA Engineer"],
    "MKT": ["Marketing Analyst", "Brand Manager", "Growth Hacker", "SEO Specialist"],
    "SAL": ["Sales Representative", "Account Manager", "Business Developer"],
    "OPS": ["Operations Manager", "Logistics Coordinator", "Process Analyst"],
    "RND": ["R&D Engineer", "Research Analyst", "Innovation Lead"],
}

job_descs = [
    "Responsible for managing team workflows and ensuring project delivery.",
    "Handles data analysis and reporting for the department.",
    "Coordinates cross-functional projects and stakeholder communication.",
    "Develops and maintains internal tools and systems.",
    "Supports strategic planning and operational excellence.",
]

# Map Fiche_Etat dataset values → valid skill etat enum values
FICHE_ETAT_MAP = {
    'draft':       'draft',
    'in_progress': 'submitted',
    'completed':   'validated',
    'validated':   'validated',
}

for _, row in emp_df.iterrows():
    uid       = oid()
    matricule = str(row['Matricule'])
    name      = str(row['Name'])
    # FIX: correct column name is Dept_Code
    dept_code = str(row['Dept_Code']) if pd.notna(row['Dept_Code']) else 'IT'
    statut    = str(row['Statut']).lower() if pd.notna(row['Statut']) else 'active'
    # FIX: correct column name is Date_Embauche
    hire_date = row['Date_Embauche'] if pd.notna(row['Date_Embauche']) else rand_date()
    dept_id   = DEPT_CODE_MAP.get(dept_code, "69a908ca99f13c1d9ce26139")

    parts = name.lower().split()
    email = f"{parts[0]}.{parts[-1]}{random.randint(1,99)}@hrplatform.com"

    # Use real years of experience from dataset (Anciennete_Ans)
    years_exp = int(round(float(row['Anciennete_Ans']))) if pd.notna(row.get('Anciennete_Ans')) else random.randint(0, 15)
    years_exp = max(0, min(years_exp, 30))  # clamp to 0-30

    # Use real number of competencies from dataset
    n_skills_real = int(row['N_Competences_Total']) if pd.notna(row.get('N_Competences_Total')) else random.randint(20, 25)
    n_skills_real = max(20, min(n_skills_real, len(skill_ids_list)))  # clamp to 20-34

    # Use real validation rate from dataset to bias etat distribution
    taux = float(row['Taux_Validation']) if pd.notna(row.get('Taux_Validation')) else 0.5
    # taux=0→mostly draft, taux=1→mostly validated
    etat_weights = [
        max(5,  round((1 - taux) * 60)),   # draft
        max(5,  round(taux * 30)),          # submitted
        max(5,  round(taux * 60)),          # validated
    ]

    position  = random.choice(positions_by_dept.get(dept_code, ["Analyst", "Specialist", "Engineer"]))

    # Build skills with real scores using real dataset values
    raw_skills = make_user_skills(years_exp, n_skills=n_skills_real, etat_weights=etat_weights)

    # FIX 3 + FIX 4: compute rankScore from real formula
    rank_score, rank = compute_rank_score(raw_skills)

    # Strip the temp _category field before inserting into MongoDB
    clean_skills = [{k: v for k, v in s.items() if k != "_category"} for s in raw_skills]

    manager_id = random.choice(MANAGER_IDS)

    user_doc = {
        "_id":               uid,
        "name":              name,
        "email":             email,
        "password":          PASSWORD_HASH,
        "matricule":         matricule,
        "telephone":         f"+216{random.randint(20000000,99999999)}",
        "department_id":     oid(dept_id),
        "manager_id":        oid(manager_id),
        "status":            statut,
        "en_ligne":          False,
        "role":              "EMPLOYEE",
        "position":          position,
        "yearsOfExperience": years_exp,
        "isGoogleUser":      False,
        "isFaceIdEnabled":   False,
        "avatar":            avatar_url(name),
        "date_embauche":     hire_date if pd.notna(hire_date) else rand_date(),
        "jobDescription":    random.choice(job_descs),
        "skills":            clean_skills,
        "rank":              rank,          # FIX 3: Junior | Mid | Senior | Expert
        "rankScore":         rank_score,    # FIX 4: 0–120 range
        "cvUrl":             None,
        "createdAt":         now(),
        "updatedAt":         now(),
        "__v":               0,
    }
    users_to_insert.append(user_doc)
    user_id_map[matricule] = uid

print(f"  {len(users_to_insert)} users generated")

# Quick sanity-check on rank distribution
rank_counts = {}
for u in users_to_insert:
    rank_counts[u["rank"]] = rank_counts.get(u["rank"], 0) + 1
print(f"  Rank distribution: {rank_counts}")
score_vals = [u["rankScore"] for u in users_to_insert]
print(f"  rankScore range: min={min(score_vals):.1f}, max={max(score_vals):.1f}, avg={sum(score_vals)/len(score_vals):.1f}")


# ══════════════════════════════════════════════════════════════
# STEP 3 — Generate Activities
# FIX 7: workflowStatus = pending_approval | approved | rejected (NO "completed")
# FIX 8: status = open | closed | completed (NO "cancelled")
# FIX 9: date is stored as a STRING
# FIX 10: skillsCovered and targetDepartments are plain STRINGS
# ══════════════════════════════════════════════════════════════
print("  Generating activities...")

ACTIVITY_TEMPLATES = [
    ("Advanced Python for Data Science",      "training", "advanced"),
    ("React & TypeScript Masterclass",        "training", "intermediate"),
    ("Leadership & Management Skills",        "training", "intermediate"),
    ("Financial Modeling Fundamentals",       "training", "beginner"),
    ("Cloud Architecture on AWS",             "workshop", "advanced"),
    ("Agile Project Management",              "training", "beginner"),
    ("Communication & Presentation Skills",  "training", "beginner"),
    ("Docker & Kubernetes Workshop",          "workshop", "intermediate"),
    ("Cybersecurity Essentials",              "training", "beginner"),
    ("Machine Learning Fundamentals",        "training", "intermediate"),
    ("Digital Marketing Strategy",           "webinar",  "beginner"),
    ("SQL & Database Optimization",          "training", "intermediate"),
    ("DevOps CI/CD Pipeline",                "workshop", "advanced"),
    ("Emotional Intelligence at Work",       "training", "beginner"),
    ("Product Management Basics",            "training", "beginner"),
    ("Spring Boot Microservices",            "training", "advanced"),
    ("Data Visualization with Power BI",     "webinar",  "beginner"),
    ("Angular Advanced Patterns",            "workshop", "advanced"),
    ("Negotiation & Conflict Resolution",    "training", "intermediate"),
    ("Blockchain & Web3 Introduction",       "webinar",  "beginner"),
    ("Node.js Performance Optimization",     "workshop", "advanced"),
    ("HR Analytics & People Data",           "training", "intermediate"),
    ("Risk Management Framework",            "training", "intermediate"),
    ("UX Design Principles",                 "workshop", "beginner"),
    ("Strategic Planning Workshop",          "workshop", "advanced"),
    ("Java Spring Security",                 "training", "advanced"),
    ("Time Management Mastery",              "training", "beginner"),
    ("MongoDB Advanced Queries",             "workshop", "intermediate"),
    ("Sales Techniques & Closing",           "training", "beginner"),
    ("Git & Version Control Best Practices", "workshop", "beginner"),
    ("AI & GPT in the Workplace",            "webinar",  "beginner"),
    ("Budgeting & Cost Control",             "training", "intermediate"),
    ("Scrum Master Certification Prep",      "training", "intermediate"),
    ("Vue.js for Beginners",                 "training", "beginner"),
    ("Supply Chain Optimization",            "training", "intermediate"),
    ("Team Building & Collaboration",        "workshop", "beginner"),
    ("GraphQL API Design",                   "workshop", "advanced"),
    ("Customer Success Management",          "training", "beginner"),
    ("Power Automate & RPA",                 "webinar",  "beginner"),
    ("Business Intelligence Reporting",      "training", "intermediate"),
    ("NestJS Backend Architecture",          "training", "advanced"),
    ("Public Speaking & Storytelling",       "workshop", "beginner"),
    ("Zero Trust Security Model",            "webinar",  "intermediate"),
    ("Excel Advanced Formulas & Macros",     "workshop", "intermediate"),
    ("Next.js Full Stack Development",       "training", "intermediate"),
    ("Lean Six Sigma Yellow Belt",           "training", "intermediate"),
    ("Redis Caching Strategies",             "workshop", "advanced"),
    ("HR Legal Compliance",                  "training", "beginner"),
    ("Innovation & Design Thinking",         "workshop", "intermediate"),
    ("Technical Interview Preparation",      "workshop", "intermediate"),
]

# Intent auto-inferred from type (matches inferIntent() in prioritization.service.ts)
def infer_intent(atype):
    if atype in ["training", "workshop"]:
        return "development"
    if atype in ["mentoring", "webinar"]:
        return "balanced"
    return "balanced"

new_activities    = []
new_activity_ids  = []
DEPT_ID_STRINGS   = list(set(DEPT_CODE_MAP.values()))  # FIX 10: keep as plain strings

for title, atype, level in ACTIVITY_TEMPLATES:
    aid      = oid()
    aid_str  = str(aid)
    new_activity_ids.append(aid_str)

    n_skills   = random.randint(1, 3)
    chosen_sk  = random.sample(skill_ids_list, n_skills)

    req_skills = [{
        "_id":          oid(),
        "skillId":      sid,                     # FIX 10: string, not ObjectId (matches schema type:String)
        "weight":       round(random.uniform(0.3, 1.5), 1),
        "requiredLevel":random.choice(["beginner", "intermediate", "advanced", "expert"]),
    } for sid in chosen_sk]

    capacity = random.choice([15, 20, 25, 30, 50])
    enrolled = random.randint(0, capacity)

    # FIX 8: only valid status values
    status    = random.choices(["open", "closed", "completed"], weights=[40, 30, 30])[0]

    # FIX 7: only valid workflowStatus values
    # If status is completed/closed, workflow must be approved
    if status in ["completed", "closed"]:
        wf_status = "approved"
    else:
        wf_status = random.choices(["approved", "pending_approval", "rejected"], weights=[60, 30, 10])[0]

    approved_by = str(random.choice(MANAGER_IDS)) if wf_status == "approved" else None
    approved_at = rand_date_2026() if wf_status == "approved" else None
    rejected_by = str(random.choice(MANAGER_IDS)) if wf_status == "rejected" else None
    rejection_reason = "Needs more detail on learning objectives." if wf_status == "rejected" else None

    # FIX 10: targetDepartments = list of strings (not ObjectIds)
    target_depts = random.sample(DEPT_ID_STRINGS, random.randint(1, 3))

    new_activities.append({
        "_id":              aid,
        "title":            title,
        "description":      f"Comprehensive {atype} on {title}. Participants will gain practical knowledge and hands-on experience.",
        "type":             atype,
        "level":            level,
        "date":             rand_date_string_2026(),   # FIX 9: STRING not datetime
        "duration":         random.choice(["1 hour", "2 hours", "3 hours", "1 day", "2 days"]),
        "capacity":         capacity,
        "enrolledCount":    enrolled,
        "status":           status,                    # FIX 8: valid enum only
        "workflowStatus":   wf_status,                 # FIX 7: valid enum only
        "intent":           infer_intent(atype),
        "skillsCovered":    chosen_sk,                 # FIX 10: list of strings
        "requiredSkills":   req_skills,
        "location":         random.choice(["Room A1", "Room B2", "Online", "Conference Hall", "Lab 3"]),
        "targetDepartments":target_depts,              # FIX 10: list of strings
        "createdBy":        oid(hr_manager_id),
        "organizerId":      oid(hr_manager_id),
        "approvedBy":       approved_by,
        "approvedAt":       approved_at,
        "rejectedBy":       rejected_by,
        "rejectionReason":  rejection_reason,
        "createdAt":        now(),
        "updatedAt":        now(),
        "__v":              0,
    })

ALL_ACTIVITY_IDS = ACTIVITY_IDS + new_activity_ids
print(f"  {len(new_activities)} activities generated")


# ══════════════════════════════════════════════════════════════
# STEP 4 — Generate Assignments
# FIX 11: type = "direct_assignment" | "recommendation" only
# ══════════════════════════════════════════════════════════════
print("  Generating assignments...")

assignments   = []
sample_users  = random.sample(users_to_insert, min(800, len(users_to_insert)))

# FIX 11: valid assignment type values only
VALID_ASSIGN_TYPES = ["direct_assignment", "recommendation"]

# FIX 11: valid assignment status values from real schema
# enum: pending | pending_manager | confirmed | notified | accepted | rejected | declined
VALID_ASSIGN_STATUSES = ["pending", "accepted", "declined", "confirmed", "notified"]

for user_doc in sample_users:
    n_assign    = random.randint(1, 4)
    chosen_acts = random.sample(ALL_ACTIVITY_IDS, min(n_assign, len(ALL_ACTIVITY_IDS)))
    manager_id  = random.choice(MANAGER_IDS)

    for act_id in chosen_acts:
        status = random.choices(
            VALID_ASSIGN_STATUSES,
            weights=[20, 45, 15, 10, 10]
        )[0]
        assignments.append({
            "_id":          oid(),
            "userId":       user_doc["_id"],
            "activityId":   oid(act_id),
            "assignedBy":   oid(hr_manager_id),
            "managerId":    oid(manager_id),
            "status":       status,
            "type":         random.choice(VALID_ASSIGN_TYPES),  # FIX 11
            "recommendedBy":oid(hr_manager_id),
            "metadata": {
                "aiScore": round(random.uniform(0.1, 1.0), 3),
                "reason":  "Suggested training based on skill gap analysis.",
            },
            "reason":       None,
            "assignedAt":   rand_date_2026(),
            "createdAt":    now(),
            "updatedAt":    now(),
            "__v":          0,
        })

print(f"  {len(assignments)} assignments generated")


# ══════════════════════════════════════════════════════════════
# STEP 5 — Generate Participations
# FIX 12: feedback = 0–10 (not 0–3)
# FIX 13: organizerRating = 1–5, only on organizer_submitted / validated statuses
# Using valid participation statuses from real schema
# ══════════════════════════════════════════════════════════════
print("  Generating participations...")

# Valid participation statuses from real schema
PART_LIFECYCLE = ["accepted", "in_progress", "organizer_submitted", "validated", "not_completed"]

participations = []

for asgn in assignments:
    if asgn["status"] in ["accepted", "confirmed", "notified"]:
        p_status = random.choices(
            PART_LIFECYCLE,
            weights=[15, 25, 20, 30, 10]
        )[0]

        progress = 100 if p_status in ["validated", "organizer_submitted", "not_completed"] else random.randint(10, 99)

        # FIX 13: organizerRating only when organizer has submitted (1–5 scale)
        org_rating = random.randint(1, 5) if p_status in ["organizer_submitted", "validated"] else None
        org_submitted_at = rand_date_2026() if p_status in ["organizer_submitted", "validated"] else None
        mgr_validated_at = rand_date_2026() if p_status == "validated" else None

        participations.append({
            "_id":                  oid(),
            "userId":               asgn["userId"],
            "activityId":           asgn["activityId"],
            "status":               p_status,
            "progress":             progress,
            "feedback":             random.randint(0, 10),  # FIX 12: 0–10 scale
            "organizerRating":      org_rating,             # FIX 13: 1–5 or null
            "organizerNote":        None,
            "organizerSubmittedAt": org_submitted_at,
            "managerValidatedAt":   mgr_validated_at,
            "lastUpdated":          rand_date_2026(),
            "createdAt":            now(),
            "updatedAt":            now(),
            "__v":                  0,
        })

print(f"  {len(participations)} participations generated")


# ══════════════════════════════════════════════════════════════
# STEP 6 — Generate Evaluations
# skillEvaluations now includes newLevel field (was missing)
# ══════════════════════════════════════════════════════════════
print("  Generating evaluations...")

evaluations       = []
validated_parts   = [p for p in participations if p["status"] == "validated"]
eval_sample       = random.sample(validated_parts, min(600, len(validated_parts)))

for part in eval_sample:
    n_skills   = random.randint(1, 3)
    chosen_sk  = random.sample(skill_ids_list, n_skills)
    overall    = random.randint(40, 100)

    skill_evals = [{
        "_id":           oid(),
        "skillId":       oid(sid),
        "previousScore": random.randint(20, 70),
        "previousLevel": random.choice(["beginner", "intermediate"]),
        "newScore":      random.randint(40, 100),
        "newLevel":      random.choice(["intermediate", "advanced", "expert"]),  # was missing
    } for sid in chosen_sk]

    evaluations.append({
        "_id":              oid(),
        "employeeId":       part["userId"],
        "evaluatorId":      oid(random.choice(MANAGER_IDS)),
        "activityId":       part["activityId"],
        "overallScore":     overall,
        "skillEvaluations": skill_evals,
        "status":           random.choices(["pending", "approved", "draft"], weights=[30, 60, 10])[0],
        "feedback":         random.choice(["Good work", "Excellent progress", "Needs improvement", "Keep it up", "Well done"]),
        "evaluationType":   "post-activity",
        "date":             rand_date_2026(),
        "createdAt":        now(),
        "updatedAt":        now(),
        "__v":              0,
    })

print(f"  {len(evaluations)} evaluations generated")


# ══════════════════════════════════════════════════════════════
# STEP 7 — Generate Notifications
# ══════════════════════════════════════════════════════════════
print("  Generating notifications...")

notif_templates = [
    ("assignment_received",  "New Training Assigned",   "You have been assigned to a new training activity."),
    ("activity_approved",    "Activity Approved",        "Your activity request has been approved."),
    ("evaluation_completed", "Evaluation Submitted",     "Your performance evaluation has been submitted."),
    ("activity_reminder",    "Activity Reminder",        "Reminder: your training starts soon."),
    ("recommendation",       "New Recommendation",       "A training has been recommended based on your profile."),
]

notifications = []
notif_sample  = random.sample(users_to_insert, min(1000, len(users_to_insert)))

for user_doc in notif_sample:
    for _ in range(random.randint(1, 5)):
        ntype, title, msg = random.choice(notif_templates)
        act_id = random.choice(ALL_ACTIVITY_IDS)
        notifications.append({
            "_id":         oid(),
            "recipientId": user_doc["_id"],
            "title":       title,
            "message":     msg,
            "read":        random.choice([True, False]),
            "type":        ntype,
            "metadata": {
                "activityId": act_id,
                "link":       f"/activities/{act_id}",
            },
            "createdAt":   rand_date_2026(),
            "updatedAt":   rand_date_2026(),
            "__v":         0,
        })

print(f"  {len(notifications)} notifications generated")


# ══════════════════════════════════════════════════════════════
# STEP 8 — Insert into MongoDB
# Skills inserted FIRST so all user skill references will populate
# ══════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  Connecting to MongoDB Atlas...")
print("="*60)

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=20000)
client.admin.command("ping")
print("  OK Connected!\n")

db = client[DB_NAME]

# FIX 2: Skills MUST be inserted first
bulk_insert(db["skills"],         skill_docs,      "skills")
bulk_insert(db["users"],          users_to_insert, "users")
bulk_insert(db["activities"],     new_activities,  "activities")
bulk_insert(db["assignments"],    assignments,     "assignments")
bulk_insert(db["participations"], participations,  "participations")
bulk_insert(db["evaluations"],    evaluations,     "evaluations")
bulk_insert(db["notifications"],  notifications,   "notifications")


# ══════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ══════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("  FINAL SUMMARY — MongoDB Collections")
print("="*60)
all_cols = [
    "users", "activities", "assignments", "participations",
    "evaluations", "notifications", "skills", "departments",
    "auditlogs", "sessions", "posts", "activityrequests"
]
for col in all_cols:
    count = db[col].count_documents({})
    print(f"  {col:<26} {count:>6} documents")

client.close()
print("\n  ✅ Seeding complete!")
print("="*60)
