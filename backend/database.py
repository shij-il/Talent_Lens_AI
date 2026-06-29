from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.jobs.create_index("created_at")
    await db.candidates.create_index([("job_id", 1), ("final_score", -1)])
    print(f"✅ Connected to MongoDB: {settings.DB_NAME}")


async def disconnect_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_db():
    return db
