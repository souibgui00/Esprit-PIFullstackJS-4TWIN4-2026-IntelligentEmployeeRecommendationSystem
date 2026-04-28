import pymongo

# Connect to MongoDB
MONGO_URI = "mongodb+srv://mohamedaminesouibgui_db_user:232JMT4753@pi.nwdrgwz.mongodb.net/"
DB_NAME = "test"

client = pymongo.MongoClient(MONGO_URI)
db = client[DB_NAME]

# Collections to clear (from seeding script)
collections_to_clear = [
    "skills", "users", "activities", "assignments", 
    "participations", "evaluations", "notifications"
]

print("Clearing test data from Atlas 'test' DB...")

for coll_name in collections_to_clear:
    collection = db[coll_name]
    count = collection.count_documents({})
    if count > 0:
        result = collection.delete_many({})
        print(f"Deleted {result.deleted_count} documents from {coll_name}")
    else:
        print(f"No documents in {coll_name}")

print("Data removal complete.")
client.close()