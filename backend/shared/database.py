"""
Database abstraction layer for SuperPage
Supports both PostgreSQL (Render) and MongoDB (Atlas) backends
"""

import os
import asyncio
from typing import Dict, List, Any, Optional, Union
from datetime import datetime
import json
import logging

# PostgreSQL imports
try:
    import asyncpg
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import text
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False

# MongoDB imports  
try:
    from motor.motor_asyncio import AsyncIOMotorClient
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Unified database manager supporting both PostgreSQL and MongoDB"""
    
    def __init__(self):
        self.db_type = self._detect_database_type()
        self.connection = None
        self.engine = None
        self.session_factory = None
        
    def _detect_database_type(self) -> str:
        """Detect which database to use based on environment variables"""
        if os.getenv('DATABASE_URL'):  # PostgreSQL connection string
            return 'postgresql'
        elif os.getenv('MONGODB_URL'):  # MongoDB connection string
            return 'mongodb'
        else:
            # Default to PostgreSQL for Render deployment
            return 'postgresql'
    
    async def connect(self):
        """Connect to the appropriate database"""
        if self.db_type == 'postgresql':
            await self._connect_postgresql()
        elif self.db_type == 'mongodb':
            await self._connect_mongodb()
        else:
            raise ValueError(f"Unsupported database type: {self.db_type}")
    
    async def _connect_postgresql(self):
        """Connect to PostgreSQL database"""
        if not POSTGRES_AVAILABLE:
            raise ImportError("PostgreSQL dependencies not installed")
            
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL environment variable not set")
        
        # Create async engine
        self.engine = create_async_engine(database_url, echo=False)
        self.session_factory = sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )
        
        # Test connection
        async with self.engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        
        logger.info("Connected to PostgreSQL database")
    
    async def _connect_mongodb(self):
        """Connect to MongoDB database"""
        if not MONGO_AVAILABLE:
            raise ImportError("MongoDB dependencies not installed")
            
        mongodb_url = os.getenv('MONGODB_URL')
        if not mongodb_url:
            raise ValueError("MONGODB_URL environment variable not set")
        
        self.connection = AsyncIOMotorClient(mongodb_url)
        
        # Test connection
        await self.connection.admin.command('ping')
        
        logger.info("Connected to MongoDB database")
    
    async def disconnect(self):
        """Disconnect from database"""
        if self.db_type == 'postgresql' and self.engine:
            await self.engine.dispose()
        elif self.db_type == 'mongodb' and self.connection:
            self.connection.close()
    
    async def insert_document(self, collection: str, document: Dict[str, Any]) -> str:
        """Insert a document into the specified collection/table"""
        if self.db_type == 'postgresql':
            return await self._insert_postgresql(collection, document)
        elif self.db_type == 'mongodb':
            return await self._insert_mongodb(collection, document)
    
    async def find_document(self, collection: str, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find a single document matching the query"""
        if self.db_type == 'postgresql':
            return await self._find_postgresql(collection, query)
        elif self.db_type == 'mongodb':
            return await self._find_mongodb(collection, query)
    
    async def find_documents(self, collection: str, query: Dict[str, Any] = None, limit: int = None) -> List[Dict[str, Any]]:
        """Find multiple documents matching the query"""
        if self.db_type == 'postgresql':
            return await self._find_many_postgresql(collection, query, limit)
        elif self.db_type == 'mongodb':
            return await self._find_many_mongodb(collection, query, limit)
    
    async def update_document(self, collection: str, query: Dict[str, Any], update: Dict[str, Any]) -> bool:
        """Update a document matching the query"""
        if self.db_type == 'postgresql':
            return await self._update_postgresql(collection, query, update)
        elif self.db_type == 'mongodb':
            return await self._update_mongodb(collection, query, update)
    
    # PostgreSQL implementations
    async def _insert_postgresql(self, table: str, document: Dict[str, Any]) -> str:
        """Insert document into PostgreSQL table"""
        async with self.session_factory() as session:
            # Create table if it doesn't exist (simplified schema)
            create_table_sql = f"""
            CREATE TABLE IF NOT EXISTS {table} (
                id SERIAL PRIMARY KEY,
                data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
            await session.execute(text(create_table_sql))
            
            # Insert document as JSONB
            insert_sql = f"INSERT INTO {table} (data) VALUES (:data) RETURNING id"
            result = await session.execute(text(insert_sql), {"data": json.dumps(document)})
            doc_id = result.scalar()
            await session.commit()
            return str(doc_id)
    
    async def _find_postgresql(self, table: str, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find document in PostgreSQL table"""
        async with self.session_factory() as session:
            # Simple query by data field (can be enhanced for complex queries)
            if 'project_id' in query:
                sql = f"SELECT data FROM {table} WHERE data->>'project_id' = :project_id LIMIT 1"
                result = await session.execute(text(sql), {"project_id": query['project_id']})
            else:
                sql = f"SELECT data FROM {table} LIMIT 1"
                result = await session.execute(text(sql))
            
            row = result.fetchone()
            return json.loads(row[0]) if row else None
    
    async def _find_many_postgresql(self, table: str, query: Dict[str, Any] = None, limit: int = None) -> List[Dict[str, Any]]:
        """Find multiple documents in PostgreSQL table"""
        async with self.session_factory() as session:
            sql = f"SELECT data FROM {table}"
            params = {}
            
            if query and 'project_id' in query:
                sql += " WHERE data->>'project_id' = :project_id"
                params['project_id'] = query['project_id']
            
            if limit:
                sql += f" LIMIT {limit}"
            
            result = await session.execute(text(sql), params)
            rows = result.fetchall()
            return [json.loads(row[0]) for row in rows]
    
    async def _update_postgresql(self, table: str, query: Dict[str, Any], update: Dict[str, Any]) -> bool:
        """Update document in PostgreSQL table"""
        async with self.session_factory() as session:
            if 'project_id' in query:
                sql = f"""
                UPDATE {table} 
                SET data = :data, updated_at = CURRENT_TIMESTAMP 
                WHERE data->>'project_id' = :project_id
                """
                result = await session.execute(text(sql), {
                    "data": json.dumps(update),
                    "project_id": query['project_id']
                })
                await session.commit()
                return result.rowcount > 0
            return False
    
    # MongoDB implementations
    async def _insert_mongodb(self, collection: str, document: Dict[str, Any]) -> str:
        """Insert document into MongoDB collection"""
        db = self.connection[os.getenv('DATABASE_NAME', 'superpage')]
        result = await db[collection].insert_one(document)
        return str(result.inserted_id)
    
    async def _find_mongodb(self, collection: str, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find document in MongoDB collection"""
        db = self.connection[os.getenv('DATABASE_NAME', 'superpage')]
        document = await db[collection].find_one(query)
        if document and '_id' in document:
            document['_id'] = str(document['_id'])
        return document
    
    async def _find_many_mongodb(self, collection: str, query: Dict[str, Any] = None, limit: int = None) -> List[Dict[str, Any]]:
        """Find multiple documents in MongoDB collection"""
        db = self.connection[os.getenv('DATABASE_NAME', 'superpage')]
        cursor = db[collection].find(query or {})
        if limit:
            cursor = cursor.limit(limit)
        
        documents = []
        async for doc in cursor:
            if '_id' in doc:
                doc['_id'] = str(doc['_id'])
            documents.append(doc)
        return documents
    
    async def _update_mongodb(self, collection: str, query: Dict[str, Any], update: Dict[str, Any]) -> bool:
        """Update document in MongoDB collection"""
        db = self.connection[os.getenv('DATABASE_NAME', 'superpage')]
        result = await db[collection].update_one(query, {"$set": update})
        return result.modified_count > 0

# Global database manager instance
db_manager = DatabaseManager()

async def get_database():
    """Dependency injection for database connection"""
    if not db_manager.connection and not db_manager.engine:
        await db_manager.connect()
    return db_manager
