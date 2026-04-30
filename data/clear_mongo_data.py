import pymongo

# Connect to MongoDB
MONGO_URI = "mongodb://sarra_mrabet:sarra@ac-skuyy89-shard-00-00.thpvndq.mongodb.net:27017,ac-skuyy89-shard-00-01.thpvndq.mongodb.net:27017,ac-skuyy89-shard-00-02.thpvndq.mongodb.net:27017/test?authSource=admin&replicaSet=atlas-cr5hej-shard-0&tls=true&retryWrites=true&w=majority"
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