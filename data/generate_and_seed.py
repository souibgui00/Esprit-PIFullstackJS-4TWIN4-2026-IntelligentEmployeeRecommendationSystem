"""
HR Platform — MongoDB Mass Seeder
===================================
Génère ~1500 users + activités + assignments + evaluations + participations + notifications
basé sur dataset.xlsx et les schémas réels de ta MongoDB.

Usage:
    pip install pymongo pandas faker bcrypt openpyxl
    python generate_and_seed.py

IMPORTANT: Mets le fichier dataset.xlsx dans le même dossier que ce script.
"""

import random
import hashlib
from datetime import datetime, timedelta, timezone
from bson import ObjectId
import pandas as pd
from pymongo import MongoClient, InsertOne
from pymongo.errors import BulkWriteError

# ══════════════════════════════════════════════════════════════
# CONFIG — modifie ici si besoin
# ══════════════════════════════════════════════════════════════
MONGO_URI = "mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/"
DB_NAME   = "pi"
DATASET   = "dataset.xlsx"          # fichier dataset dans le même dossier
PASSWORD_HASH = "$2b$10$Y1Q9tdCgdR.OSl2pHrlRUuIsI16VojYyIhpfE/2Fjl7M..JiHtkLe"  # "Admin1234!" hashé bcrypt

# ══════════════════════════════════════════════════════════════
# IDs RÉELS depuis ta MongoDB (skills, depts, managers)
# ══════════════════════════════════════════════════════════════

SKILL_IDS = [
    ("69a65d1524df5f8ade495ffa", "JavaScript",             "knowledge"),
    ("69a65d1524df5f8ade495ffb", "React",                  "knowHow"),
    ("69a65d1524df5f8ade495ffc", "Node.js",                "knowHow"),
    ("69a65d1524df5f8ade495ffd", "Python",                 "knowledge"),
    ("69a65d1524df5f8ade495ffe", "SQL",                    "knowledge"),
    ("69a65d1524df5f8ade495fff", "Project Management",     "softSkill"),
    ("69a65d1524df5f8ade496000", "Communication",          "softSkill"),
    ("69a65d1524df5f8ade496001", "Docker",                 "knowHow"),
    ("69a65d1524df5f8ade496002", "TypeScript",             "knowledge"),
    ("69a65d1624df5f8ade496003", "Tailwind CSS",           "knowHow"),
    ("69a65d1624df5f8ade496004", "Java",                   "knowledge"),
    ("69a65d1624df5f8ade496005", "Spring Boot",            "knowHow"),
    ("69a65d1624df5f8ade496006", "MongoDB",                "knowledge"),
    ("69a65d1624df5f8ade496007", "Problem Solving",        "softSkill"),
    ("69a65d1624df5f8ade496008", "Teamwork",               "softSkill"),
    ("69c35744938667ce6c56f6f5", "C++",                    "knowHow"),
    ("69c35744938667ce6c56f6f6", "HTML",                   "knowHow"),
    ("69c35744938667ce6c56f6f7", "CSS",                    "knowHow"),
    ("69c35744938667ce6c56f6fb", "Git",                    "knowHow"),
    ("69c35f9730e4aeb4c1d9ce93", "Financial Analysis",     "knowledge"),
    ("69c59177ec671da99c220529", "Agile",                  "knowledge"),
    ("69c653b47e89ef7640c18373", "Angular",                "knowHow"),
    ("69c653b57e89ef7640c18375", "Express",                "knowHow"),
    ("69c653b57e89ef7640c1837f", "AWS",                    "knowHow"),
    ("69c653b57e89ef7640c18385", "Scrum",                  "knowledge"),
    ("69c653b57e89ef7640c18387", "AI",                     "knowledge"),
    ("69d13572e78b2781b110441a", "Decision-Making",        "technique"),
    ("69d13584e78b2781b110441e", "Leadership",             "technique"),
    ("69d136eee78b2781b1104ac1", "Budgeting",              "technique"),
    ("69d1382de78b2781b1104b23", "Productivity",           "technique"),
    ("69d13841e78b2781b1104b26", "Time Management",        "technique"),
    ("69d137d0e78b2781b1104b06", "Cybersecurity",          "technique"),
    ("69c35f9730e4aeb4c1d9ce91", "Digital Marketing",      "knowledge"),
    ("69cbbb2d3602c81856ed2893", "Google Analytics",       "knowHow"),
]

DEPT_MAP = {
    "HR":  ("69a60e1d943f3dabdd8219e7", "Human Resources",  "69a610c3da349bb345989385"),
    "FIN": ("69a757ecae79cebaa3cc922a", "Finance",          "69cfa92c15aaf16896699900"),
    "IT":  ("69a908ca99f13c1d9ce26139", "Technology",       "69d561f7e4613e0304827c5d"),
    # Pour les autres départements du dataset, on les mappe sur les 3 existants
}

# Mapping dataset dept codes → MongoDB dept IDs
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
    "69a610c3da349bb345989385",   # amine Souibgui (hr)
    "69cfa92c15aaf16896699900",   # Mohamed Amine Souibgui (MANAGER)
    "69d561f7e4613e0304827c5d",   # aziz omri (MANAGER)
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

LEVELS     = ["beginner", "intermediate", "advanced"]
SKILL_ETAT = ["draft", "in_progress", "completed", "validated"]
COMP_ETAT  = ["validated", "draft", "in_progress", "completed"]

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

def avatar_url(name):
    h = hashlib.md5(name.encode()).hexdigest()
    return f"https://i.pravatar.cc/150?u={h}"

def bulk_insert(collection, docs, label):
    if not docs:
        print(f"  ⚠  {label}: rien à insérer")
        return
    inserted = skipped = 0
    for i in range(0, len(docs), 500):
        batch = docs[i:i+500]
        try:
            r = collection.bulk_write([InsertOne(d) for d in batch], ordered=False)
            inserted += r.inserted_count
        except BulkWriteError as e:
            inserted += e.details.get("nInserted", 0)
            skipped  += sum(1 for err in e.details.get("writeErrors",[]) if err.get("code")==11000)
    print(f"  ✓  {label}: {inserted} insérés, {skipped} ignorés (doublons)")

# ══════════════════════════════════════════════════════════════
# ÉTAPE 1 — Charger dataset.xlsx
# ══════════════════════════════════════════════════════════════

print("\n" + "="*55)
print("  Chargement dataset.xlsx...")
print("="*55)

df = pd.read_excel(DATASET)
print(f"  {len(df)} lignes, {df['Matricule'].nunique()} employés uniques")

# Une ligne par employé (première occurrence)
emp_df = df.drop_duplicates('Matricule').copy()
emp_df['Date Embauche'] = pd.to_datetime(emp_df['Date Embauche'], errors='coerce')

# ══════════════════════════════════════════════════════════════
# ÉTAPE 2 — Générer les USERS
# ══════════════════════════════════════════════════════════════

print("\n  Génération des users...")

skill_ids_list = [s[0] for s in SKILL_IDS]

def make_user_skills(n_skills=None):
    """Génère un tableau skills[] comme dans ta collection users."""
    if n_skills is None:
        n_skills = random.randint(3, 12)
    chosen = random.sample(skill_ids_list, min(n_skills, len(skill_ids_list)))
    skills = []
    for sid in chosen:
        score     = random.randint(20, 100)
        auto_eval = round(random.uniform(0, score/100), 2)
        hier_eval = round(random.uniform(0, score/100), 2)
        prog      = round(random.uniform(0, 1), 2)
        etat      = random.choices(SKILL_ETAT, weights=[20, 25, 25, 30])[0]
        skills.append({
            "_id":            oid(),
            "skillId":        oid(sid),
            "level":          random.choice(LEVELS),
            "score":          score,
            "auto_eval":      auto_eval,
            "hierarchie_eval":hier_eval,
            "progression":    prog,
            "etat":           etat,
            "lastUpdated":    rand_date_2026(),
        })
    return skills

users_to_insert = []
user_id_map = {}   # matricule -> ObjectId (pour les relations)

for _, row in emp_df.iterrows():
    uid         = oid()
    matricule   = str(row['Matricule'])
    name        = str(row['Name'])
    dept_code   = str(row['Department Code'])
    statut      = str(row['Statut']).lower() if pd.notna(row['Statut']) else 'active'
    hire_date   = row['Date Embauche'] if pd.notna(row['Date Embauche']) else rand_date()
    dept_id_str = DEPT_CODE_MAP.get(dept_code, "69a908ca99f13c1d9ce26139")

    # email: prénom.nom@company.com
    parts = name.lower().split()
    email = f"{parts[0]}.{parts[-1]}{random.randint(1,99)}@hrplatform.com"

    years_exp = random.randint(0, 15)
    positions_by_dept = {
        "HR": ["HR Specialist", "Recruiter", "HR Coordinator", "Talent Manager"],
        "FIN": ["Financial Analyst", "Accountant", "Budget Manager", "Controller"],
        "IT": ["Software Engineer", "DevOps Engineer", "Data Scientist", "QA Engineer"],
        "MKT": ["Marketing Analyst", "Brand Manager", "Growth Hacker", "SEO Specialist"],
        "SAL": ["Sales Representative", "Account Manager", "Business Developer"],
        "OPS": ["Operations Manager", "Logistics Coordinator", "Process Analyst"],
        "RND": ["R&D Engineer", "Research Analyst", "Innovation Lead"],
    }
    positions = positions_by_dept.get(dept_code, ["Analyst", "Specialist", "Coordinator", "Engineer"])
    position = random.choice(positions)

    job_descs = [
        "Responsible for managing team workflows and ensuring project delivery.",
        "Handles data analysis and reporting for the department.",
        "Coordinates cross-functional projects and stakeholder communication.",
        "Develops and maintains internal tools and systems.",
        "Supports strategic planning and operational excellence.",
    ]

    user_doc = {
        "_id":               uid,
        "name":              name,
        "email":             email,
        "password":          PASSWORD_HASH,
        "matricule":         matricule,
        "telephone":         f"+216{random.randint(20000000,99999999)}",
        "department_id":     oid(dept_id_str),
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
        "skills":            make_user_skills(random.randint(4, 15)),
        "rank":              random.choice(["Bronze", "Silver", "Gold", "Platinum"]),
        "rankScore":         random.randint(10, 500),
        "cvUrl":             None,
        "createdAt":         now(),
        "updatedAt":         now(),
        "__v":               0,
    }
    users_to_insert.append(user_doc)
    user_id_map[matricule] = uid

print(f"  {len(users_to_insert)} users générés")

# ══════════════════════════════════════════════════════════════
# ÉTAPE 3 — Générer les ACTIVITÉS (50 nouvelles)
# ══════════════════════════════════════════════════════════════

print("  Génération des activités...")

ACTIVITY_TEMPLATES = [
    ("Advanced Python for Data Science",       "training", "advanced"),
    ("React & TypeScript Masterclass",         "training", "intermediate"),
    ("Leadership & Management Skills",         "training", "intermediate"),
    ("Financial Modeling Fundamentals",        "training", "beginner"),
    ("Cloud Architecture on AWS",              "workshop", "advanced"),
    ("Agile Project Management",               "training", "beginner"),
    ("Communication & Presentation Skills",   "training", "beginner"),
    ("Docker & Kubernetes Workshop",           "workshop", "intermediate"),
    ("Cybersecurity Essentials",               "training", "beginner"),
    ("Machine Learning Fundamentals",         "training", "intermediate"),
    ("Digital Marketing Strategy",            "webinar",  "beginner"),
    ("SQL & Database Optimization",           "training", "intermediate"),
    ("DevOps CI/CD Pipeline",                 "workshop", "advanced"),
    ("Emotional Intelligence at Work",        "training", "beginner"),
    ("Product Management Basics",             "training", "beginner"),
    ("Spring Boot Microservices",             "training", "advanced"),
    ("Data Visualization with Power BI",      "webinar",  "beginner"),
    ("Angular Advanced Patterns",             "workshop", "advanced"),
    ("Negotiation & Conflict Resolution",     "training", "intermediate"),
    ("Blockchain & Web3 Introduction",        "webinar",  "beginner"),
    ("Node.js Performance Optimization",      "workshop", "advanced"),
    ("HR Analytics & People Data",            "training", "intermediate"),
    ("Risk Management Framework",             "training", "intermediate"),
    ("UX Design Principles",                  "workshop", "beginner"),
    ("Strategic Planning Workshop",           "workshop", "advanced"),
    ("Java Spring Security",                  "training", "advanced"),
    ("Time Management Mastery",               "training", "beginner"),
    ("MongoDB Advanced Queries",              "workshop", "intermediate"),
    ("Sales Techniques & Closing",            "training", "beginner"),
    ("Git & Version Control Best Practices",  "workshop", "beginner"),
    ("AI & GPT in the Workplace",             "webinar",  "beginner"),
    ("Budgeting & Cost Control",              "training", "intermediate"),
    ("Scrum Master Certification Prep",       "training", "intermediate"),
    ("Vue.js for Beginners",                  "training", "beginner"),
    ("Supply Chain Optimization",             "training", "intermediate"),
    ("Team Building & Collaboration",         "workshop", "beginner"),
    ("GraphQL API Design",                    "workshop", "advanced"),
    ("Customer Success Management",           "training", "beginner"),
    ("Power Automate & RPA",                  "webinar",  "beginner"),
    ("Business Intelligence Reporting",       "training", "intermediate"),
    ("NestJS Backend Architecture",           "training", "advanced"),
    ("Public Speaking & Storytelling",        "workshop", "beginner"),
    ("Zero Trust Security Model",             "webinar",  "intermediate"),
    ("Excel Advanced Formulas & Macros",      "workshop", "intermediate"),
    ("Next.js Full Stack Development",        "training", "intermediate"),
    ("Lean Six Sigma Yellow Belt",            "training", "intermediate"),
    ("Redis Caching Strategies",              "workshop", "advanced"),
    ("HR Legal Compliance",                   "training", "beginner"),
    ("Innovation & Design Thinking",          "workshop", "intermediate"),
    ("Technical Interview Preparation",       "workshop", "intermediate"),
]

hr_manager_id  = "69a610c3da349bb345989385"
new_activities = []
new_activity_ids = []

for title, atype, level in ACTIVITY_TEMPLATES:
    aid = oid()
    new_activity_ids.append(str(aid))
    n_skills  = random.randint(1, 3)
    chosen_sk = random.sample(skill_ids_list, n_skills)
    req_skills = [{
        "_id":           oid(),
        "skillId":       oid(sid),
        "weight":        round(random.uniform(0.3, 1.0), 1),
        "requiredLevel": random.choice(LEVELS),
    } for sid in chosen_sk]

    capacity    = random.choice([15, 20, 25, 30, 50])
    enrolled    = random.randint(0, capacity)
    status      = random.choices(["open","completed","cancelled"], weights=[50,45,5])[0]
    wf_status   = "completed" if status == "completed" else random.choice(["approved","pending_approval"])
    activity_dt = rand_date_2026()

    new_activities.append({
        "_id":              aid,
        "title":            title,
        "description":      f"Comprehensive {atype} on {title}. Participants will gain practical knowledge and hands-on experience.",
        "type":             atype,
        "level":            level,
        "date":             activity_dt,
        "duration":         random.choice(["1 hour","2 hours","3 hours","1 day","2 days"]),
        "capacity":         capacity,
        "enrolledCount":    enrolled,
        "status":           status,
        "workflowStatus":   wf_status,
        "skillsCovered":    [oid(s) for s in chosen_sk],
        "requiredSkills":   req_skills,
        "location":         random.choice(["Room A1","Room B2","Online","Conference Hall","Lab 3"]),
        "targetDepartments":[oid(random.choice(list(DEPT_CODE_MAP.values()))) for _ in range(random.randint(1,3))],
        "createdBy":        oid(hr_manager_id),
        "organizerId":      oid(hr_manager_id),
        "approvedBy":       oid(random.choice(MANAGER_IDS)) if wf_status in ["approved","completed"] else None,
        "approvedAt":       rand_date_2026() if wf_status in ["approved","completed"] else None,
        "intent":           None,
        "createdAt":        now(),
        "updatedAt":        now(),
        "__v":              0,
    })

ALL_ACTIVITY_IDS = ACTIVITY_IDS + new_activity_ids
print(f"  {len(new_activities)} nouvelles activités générées")

# ══════════════════════════════════════════════════════════════
# ÉTAPE 4 — Générer ASSIGNMENTS
# ══════════════════════════════════════════════════════════════

print("  Génération des assignments...")

assignments = []
sample_users = random.sample(users_to_insert, min(800, len(users_to_insert)))

for user_doc in sample_users:
    n_assign = random.randint(1, 4)
    chosen_acts = random.sample(ALL_ACTIVITY_IDS, min(n_assign, len(ALL_ACTIVITY_IDS)))
    manager_id = random.choice(MANAGER_IDS)
    for act_id in chosen_acts:
        status = random.choices(
            ["pending","accepted","declined","completed"],
            weights=[20, 45, 15, 20]
        )[0]
        assignments.append({
            "_id":          oid(),
            "userId":       user_doc["_id"],
            "activityId":   oid(act_id),
            "assignedBy":   oid(hr_manager_id),
            "managerId":    oid(manager_id),
            "status":       status,
            "type":         random.choice(["recommendation","manual"]),
            "recommendedBy":oid(hr_manager_id),
            "metadata": {
                "aiScore": random.randint(1, 10),
                "reason":  "Suggested training based on skill match analysis.",
            },
            "assignedAt":   rand_date_2026(),
            "createdAt":    now(),
            "updatedAt":    now(),
            "__v":          0,
        })

print(f"  {len(assignments)} assignments générés")

# ══════════════════════════════════════════════════════════════
# ÉTAPE 5 — Générer PARTICIPATIONS
# ══════════════════════════════════════════════════════════════

print("  Génération des participations...")

participations = []
part_statuses = ["enrolled","validated","completed","declined","withdrawn"]

for asgn in assignments:
    if asgn["status"] in ["accepted", "completed"]:
        p_status  = random.choices(
            ["enrolled","validated","completed"],
            weights=[20, 50, 30]
        )[0]
        progress = 100 if p_status == "completed" else random.randint(10, 99)
        participations.append({
            "_id":                  oid(),
            "userId":               asgn["userId"],
            "activityId":           asgn["activityId"],
            "status":               p_status,
            "progress":             progress,
            "feedback":             random.choice([0, 0, 1, 2, 3]),
            "organizerRating":      random.randint(3, 5) if p_status == "validated" else None,
            "organizerNote":        None,
            "organizerSubmittedAt": rand_date_2026() if p_status == "validated" else None,
            "managerValidatedAt":   None,
            "lastUpdated":          rand_date_2026(),
            "createdAt":            now(),
            "updatedAt":            now(),
            "__v":                  0,
        })

print(f"  {len(participations)} participations générées")

# ══════════════════════════════════════════════════════════════
# ÉTAPE 6 — Générer EVALUATIONS
# ══════════════════════════════════════════════════════════════

print("  Génération des évaluations...")

evaluations = []
validated_parts = [p for p in participations if p["status"] == "validated"]
eval_sample = random.sample(validated_parts, min(600, len(validated_parts)))

for part in eval_sample:
    n_skills   = random.randint(1, 3)
    chosen_sk  = random.sample(skill_ids_list, n_skills)
    overall    = random.randint(40, 100)
    skill_evals = [{
        "_id":      oid(),
        "skillId":  oid(sid),
        "newScore": random.randint(40, 100),
    } for sid in chosen_sk]

    evaluations.append({
        "_id":             oid(),
        "employeeId":      part["userId"],
        "evaluatorId":     oid(random.choice(MANAGER_IDS)),
        "activityId":      part["activityId"],
        "overallScore":    overall,
        "skillEvaluations":skill_evals,
        "status":          random.choice(["approved","pending"]),
        "feedback":        random.choice(["Good work","Excellent progress","Needs improvement","Keep it up","Well done"]),
        "evaluationType":  "post-activity",
        "date":            rand_date_2026(),
        "createdAt":       now(),
        "updatedAt":       now(),
        "__v":             0,
    })

print(f"  {len(evaluations)} évaluations générées")

# ══════════════════════════════════════════════════════════════
# ÉTAPE 7 — Générer NOTIFICATIONS
# ══════════════════════════════════════════════════════════════

print("  Génération des notifications...")

notif_types = [
    ("assignment_received",  "New Training Assigned",      "You have been assigned to a new training activity."),
    ("activity_approved",    "Activity Approved",           "Your activity request has been approved."),
    ("evaluation_completed", "Evaluation Submitted",        "Your performance evaluation has been submitted."),
    ("activity_reminder",    "Activity Reminder",           "Reminder: your training starts soon."),
    ("recommendation",       "New Recommendation",          "A training has been recommended for you based on your profile."),
]

notifications = []
notif_sample  = random.sample(users_to_insert, min(1000, len(users_to_insert)))

for user_doc in notif_sample:
    n_notifs = random.randint(1, 5)
    for _ in range(n_notifs):
        ntype, title, msg = random.choice(notif_types)
        act_id = random.choice(ALL_ACTIVITY_IDS)
        notifications.append({
            "_id":         oid(),
            "recipientId": user_doc["_id"],
            "title":       title,
            "message":     msg,
            "read":        random.choice([True, False]),
            "type":        ntype,
            "metadata": {
                "activityId": oid(act_id),
                "link":       f"/activities/{act_id}",
            },
            "createdAt":   rand_date_2026(),
            "updatedAt":   rand_date_2026(),
            "__v":         0,
        })

print(f"  {len(notifications)} notifications générées")

# ══════════════════════════════════════════════════════════════
# ÉTAPE 8 — INSERT dans MongoDB
# ══════════════════════════════════════════════════════════════

print("\n" + "="*55)
print("  Connexion à MongoDB Atlas...")
print("="*55)

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=20000)
client.admin.command("ping")
print("  ✓ Connecté!\n")

db = client[DB_NAME]

bulk_insert(db["users"],         users_to_insert, "users")
bulk_insert(db["activities"],    new_activities,  "activities")
bulk_insert(db["assignments"],   assignments,     "assignments")
bulk_insert(db["participations"],participations,  "participations")
bulk_insert(db["evaluations"],   evaluations,     "evaluations")
bulk_insert(db["notifications"], notifications,   "notifications")

# ══════════════════════════════════════════════════════════════
# RÉSUMÉ FINAL
# ══════════════════════════════════════════════════════════════

print("\n" + "="*55)
print("  RÉSUMÉ FINAL — Collections dans MongoDB")
print("="*55)
all_cols = ["users","activities","assignments","participations","evaluations","notifications",
            "skills","departments","auditlogs","sessions","posts","activityrequests"]
for col in all_cols:
    count = db[col].count_documents({})
    print(f"  {col:<25} {count:>6} documents")

client.close()
print("\n  ✅ Seeding terminé avec succès!")
print("="*55)
