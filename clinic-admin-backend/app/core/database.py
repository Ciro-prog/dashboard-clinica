from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .config import settings

class DatabaseManager:
    client: AsyncIOMotorClient = None
    database: AsyncIOMotorDatabase = None

database_manager = DatabaseManager()


async def connect_to_mongo():
    """Create database connection"""
    database_manager.client = AsyncIOMotorClient(settings.mongodb_url)
    database_manager.database = database_manager.client[settings.database_name]
    
    # Test connection
    try:
        await database_manager.client.admin.command('ping')
        print(f"Connected to MongoDB: {settings.database_name}")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close database connection"""
    if database_manager.client:
        database_manager.client.close()
        print("Disconnected from MongoDB")


async def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    return database_manager.database


# Collections
async def get_collection(collection_name: str):
    """Get collection instance"""
    db = await get_database()
    return db[collection_name]