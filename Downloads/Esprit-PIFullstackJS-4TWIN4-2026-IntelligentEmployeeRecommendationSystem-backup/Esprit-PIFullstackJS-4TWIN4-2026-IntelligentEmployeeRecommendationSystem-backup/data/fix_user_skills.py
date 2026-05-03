"""
fix_user_skills.py
==================
Fixes seeded employees that have 0 or 1 skill because their skillId references
point to hardcoded IDs that don't match the actual Skills collection.

Strategy:
  1. Connect to MongoDB and fetch ALL real skill documents (with their real _id values).
  2. Find every seeded employee (email ends with @hrplatform.com).
  3. For each employee, build a fresh skill list using the REAL skill IDs and
     recalculate rank / rankScore using the same formula as NestJS.
  4. Bulk-update in batches of 200.

Usage:
    python fix_user_skills.py
"""

import random
import sys
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from pymongo import MongoClient, UpdateOne
from pymongo.errors import BulkWriteError
import pandas as pd

# ── CONFIG ────────────────────────────────────────────────────────────────────
MONGO_URI = "mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/"
DB_NAME   = "test"

# ── SCORING — mirrors NestJS ScoringService + UsersService ───────────────────
LEVEL_BASE = {"beginner": 25, "intermediate": 50, "advanced": 75, "expert": 100}

SKILL_TYPE_TO_CATEGORY = {
    "technique":       "knowhow",
    "opérationnelle":  "knowledge",
    "transverse":      "softskill",
    "comportementale": "softskill",
}

CATEGORY_WEIGHTS = {"knowledge": 0.5, "knowhow": 0.3, "softskill": 0.2}

def now():
    return datetime.now(timezone.utc)

def rand_date_2026():
    start = datetime(2026, 1, 1, tzinfo=timezone.utc)
    end   = datetime(2026, 4, 20, tzinfo=timezone.utc)
    return start + timedelta(seconds=random.randint(0, int((end - start).total_seconds())))

def compute_skill_score(level, years_exp, auto_eval, hier_eval, last_updated):
    base      = LEVEL_BASE.get(level, 25)
    exp_bonus = min(years_exp * 2, 20)
    six_months_ago = now() - timedelta(days=180)
    prog_bonus = 5 if last_updated > six_months_ago else 0

    def norm(v):
        if v <= 0: return 0
        if v <= 5: return max(1, min(5, v))
        if v <= 10: return max(1, min(5, v / 2))
        return max(1, min(5, v / 20))

    feedback_bonus = (0.4 * norm(auto_eval) + 0.6 * norm(hier_eval)) * 2
    return min(round(base + exp_bonus + prog_bonus + feedback_bonus, 1), 120)

def compute_rank_score(skills_list):
    category_scores = {"knowledge": [], "knowhow": [], "softskill": []}
    for s in skills_list:
        cat = s.get("_category", "knowhow")
        category_scores[cat].append(s["score"])

    def avg(lst): return sum(lst) / len(lst) if lst else 0
    cat_avgs = {c: avg(v) for c, v in category_scores.items()}

    weighted_sum = total_weight = 0
    for cat, weight in CATEGORY_WEIGHTS.items():
        if category_scores[cat]:
            weighted_sum += cat_avgs[cat] * weight
            total_weight += weight

    rank_score = round(weighted_sum / total_weight, 1) if total_weight > 0 else 0

    if rank_score > 95:  rank = "Expert"
    elif rank_score > 75: rank = "Senior"
    elif rank_score > 45: rank = "Mid"
    else:                 rank = "Junior"

    return rank_score, rank

def make_skills_for_user(skill_pool, years_exp, n_skills):
    """Build a valid skill list using REAL skill IDs from the database."""
    n = max(3, min(n_skills, len(skill_pool)))
    chosen = random.sample(skill_pool, n)
    skills = []

    for skill_meta in chosen:
        level       = random.choice(["beginner", "intermediate", "advanced", "expert"])
        auto_eval   = random.randint(0, 100)
        hier_eval   = random.randint(0, 100)
        last_updated = rand_date_2026()
        score       = compute_skill_score(level, years_exp, auto_eval, hier_eval, last_updated)

        stype    = skill_meta.get("type", "technique")
        category = SKILL_TYPE_TO_CATEGORY.get(stype, "knowhow")

        skills.append({
            "_id":             ObjectId(),
            "skillId":         skill_meta["_id"],   # ← real ObjectId from DB
            "level":           level,
            "score":           score,
            "auto_eval":       auto_eval,
            "hierarchie_eval": hier_eval,
            "progression":     round(random.uniform(0, 1), 2),
            "etat":            random.choice(["draft", "submitted", "validated"]),
            "lastUpdated":     last_updated,
            "_category":       category,            # stripped before update
        })
    return skills


# ── MAIN ──────────────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("  Connecting to MongoDB...")
print("="*60)

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=20000)
client.admin.command("ping")
print("  Connected!\n")

db = client[DB_NAME]

# ── Step 1: Fetch real skills ─────────────────────────────────────────────────
skill_pool = list(db.skills.find({}, {"_id": 1, "name": 1, "type": 1, "category": 1}))
if not skill_pool:
    print("ERROR: No skills found in the database. Please seed skills first.")
    sys.exit(1)

print(f"  Found {len(skill_pool)} real skills in '{DB_NAME}.skills':")
for s in skill_pool[:10]:
    print(f"    {s['name']:30s}  _id={s['_id']}")
if len(skill_pool) > 10:
    print(f"    ... and {len(skill_pool) - 10} more")

# ── Step 2: Find all seeded employees ─────────────────────────────────────────
print("\n  Querying seeded employees (@hrplatform.com)...")
seeded_users = list(db.users.find(
    {"email": {"$regex": "@hrplatform\\.com$"}},
    {"_id": 1, "name": 1, "yearsOfExperience": 1}
))
print(f"  Found {len(seeded_users)} seeded employees to fix.\n")

if not seeded_users:
    print("No seeded users found. Nothing to fix.")
    sys.exit(0)

# ── Step 3: Build bulk updates ────────────────────────────────────────────────
print("  Building skill updates...")
updates = []
rank_dist = {"Expert": 0, "Senior": 0, "Mid": 0, "Junior": 0}
scores_list = []

for user in seeded_users:
    years_exp = user.get("yearsOfExperience", 3)

    # Number of skills: 4–12, biased by experience
    if years_exp >= 10:
        n_skills = random.randint(7, 12)
    elif years_exp >= 5:
        n_skills = random.randint(5, 10)
    else:
        n_skills = random.randint(3, 7)

    raw_skills = make_skills_for_user(skill_pool, years_exp, n_skills)
    rank_score, rank = compute_rank_score(raw_skills)

    # Strip internal _category before storing
    clean_skills = [{k: v for k, v in s.items() if k != "_category"} for s in raw_skills]

    rank_dist[rank] += 1
    scores_list.append(rank_score)

    updates.append(UpdateOne(
        {"_id": user["_id"]},
        {"$set": {
            "skills":    clean_skills,
            "rank":      rank,
            "rankScore": rank_score,
            "updatedAt": now(),
        }}
    ))

# ── Step 4: Execute in batches of 200 ────────────────────────────────────────
print(f"  Executing {len(updates)} updates in batches of 200...")
total_modified = 0
for i in range(0, len(updates), 200):
    batch = updates[i:i+200]
    result = db.users.bulk_write(batch, ordered=False)
    total_modified += result.modified_count
    print(f"    Batch {i//200 + 1}: {result.modified_count} updated")

# ── Summary ───────────────────────────────────────────────────────────────────
print(f"\n{'='*60}")
print(f"  Fix complete!")
print(f"  Total employees updated: {total_modified}")
print(f"  Rank distribution: {rank_dist}")
print(f"  rankScore range: min={min(scores_list):.1f}, max={max(scores_list):.1f}, avg={sum(scores_list)/len(scores_list):.1f}")
print(f"\n  Each employee now has {3}–{12} real skills with correct ObjectId references.")
print(f"  populate('skills.skillId') will now resolve correctly in NestJS.")
print("="*60 + "\n")

client.close()
