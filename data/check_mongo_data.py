import pandas as pd
from pymongo import MongoClient

# Connect to MongoDB
# Try local first, then Atlas
try:
    MONGO_URI = "mongodb://localhost:27017/"
    DB_NAME = "test"  # User's DB name
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    print("Connected to local MongoDB (test)")
except:
    MONGO_URI = "mongodb://sarra_mrabet:sarra@ac-skuyy89-shard-00-00.thpvndq.mongodb.net:27017,ac-skuyy89-shard-00-01.thpvndq.mongodb.net:27017,ac-skuyy89-shard-00-02.thpvndq.mongodb.net:27017/test?authSource=admin&replicaSet=atlas-cr5hej-shard-0&tls=true&retryWrites=true&w=majority"
    DB_NAME = "pi"
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    print("Connected to Atlas MongoDB")

# Check users collection
users = db['users']
user_count = users.count_documents({})
print(f"Total users: {user_count}")

if user_count == 0:
    print("No data in local DB. Checking Atlas...")
    client.close()
    MONGO_URI = "mongodb://sarra_mrabet:sarra@ac-skuyy89-shard-00-00.thpvndq.mongodb.net:27017,ac-skuyy89-shard-00-01.thpvndq.mongodb.net:27017,ac-skuyy89-shard-00-02.thpvndq.mongodb.net:27017/test?authSource=admin&replicaSet=atlas-cr5hej-shard-0&tls=true&retryWrites=true&w=majority"
    DB_NAME = "test"  # User's DB name
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    print("Connected to Atlas MongoDB (test)")
    users = db['users']
    user_count = users.count_documents({})
    print(f"Total users in Atlas: {user_count}")

# List all collections
collections = db.list_collection_names()
print(f"Collections in DB: {collections}")

# Check if data is in other collections
for coll in collections:
    count = db[coll].count_documents({})
    print(f"{coll}: {count} documents")

if user_count > 0:
    sample_user = users.find_one()
    if sample_user:
        print("Sample user fields:", list(sample_user.keys()))
        print("Sample user data:")
        for key, value in sample_user.items():
            if key not in ['_id', 'password']:  # Skip sensitive fields
                print(f"  {key}: {value}")

# Check if skills are populated
users_with_skills = users.count_documents({"skills": {"$exists": True, "$ne": []}})
print(f"Users with skills: {users_with_skills}")

# Check activities
activities = db['activities']
act_count = activities.count_documents({})
print(f"Total activities: {act_count}")

# Check departments
depts = db['departments']
dept_count = depts.count_documents({})
print(f"Total departments: {dept_count}")

client.close()