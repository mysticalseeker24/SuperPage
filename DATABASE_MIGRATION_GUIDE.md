# 🗄️ Database Migration Guide: MongoDB → PostgreSQL

## Overview

SuperPage now supports **Render PostgreSQL** for simplified deployment and better integration with Render's infrastructure. This guide covers the migration from MongoDB to PostgreSQL.

## 🔄 Migration Strategy

### **Option 1: Fresh Deployment (Recommended)**
Start with PostgreSQL from the beginning - ideal for new deployments.

### **Option 2: Gradual Migration**
Use the database abstraction layer to support both databases during transition.

## 📋 PostgreSQL Setup

### **1. Database Schema**
Run the schema setup script:
```sql
-- Connect to your Render PostgreSQL database
psql $DATABASE_URL -f scripts/setup-postgres-schema.sql
```

### **2. Environment Variables**
Update your environment variables:
```bash
# Replace MongoDB variables
# MONGODB_URL=mongodb+srv://...
# DATABASE_NAME=superpage

# With PostgreSQL variables
DATABASE_URL=postgresql://user:password@host:port/database
DATABASE_NAME=superpage
```

### **3. Dependencies**
PostgreSQL dependencies are already added to requirements.txt:
```txt
asyncpg>=0.29.0,<1.0.0
sqlalchemy>=2.0.0,<3.0.0
alembic>=1.13.0,<2.0.0
```

## 🏗️ Database Schema

### **Tables Created:**

#### **1. ingestion_jobs**
- Stores web scraping jobs and extracted data
- JSONB fields for flexible data storage
- Indexed by project_id and status

#### **2. processed_features**
- Stores ML-ready feature vectors
- JSONB for features and metadata
- Linked to projects by project_id

#### **3. predictions**
- Stores ML prediction results
- SHAP explanations in JSONB
- Decimal precision for scores

#### **4. blockchain_transactions**
- Stores on-chain transaction records
- Transaction hashes and block information
- Gas usage and network details

#### **5. projects (Master Table)**
- Unified project information
- Links all other tables
- Comprehensive indexing

### **Views:**
- **project_summary**: Unified view across all services

## 🔧 Database Abstraction Layer

The `backend/shared/database.py` module provides:

### **Unified Interface:**
```python
from backend.shared.database import get_database

# Works with both PostgreSQL and MongoDB
db = await get_database()

# Insert document
doc_id = await db.insert_document('projects', project_data)

# Find document
project = await db.find_document('projects', {'project_id': 'test-123'})

# Update document
success = await db.update_document('projects', 
    {'project_id': 'test-123'}, 
    {'status': 'completed'})
```

### **Automatic Detection:**
- Detects database type from environment variables
- `DATABASE_URL` → PostgreSQL
- `MONGODB_URL` → MongoDB

## 🚀 Render Deployment

### **1. render.yaml Configuration**
```yaml
databases:
  - name: superpage-db
    databaseName: superpage
    user: superpage_user
    region: oregon
    plan: starter

services:
  - name: superpage-ingestion
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: superpage-db
          property: connectionString
```

### **2. Automatic Database Connection**
Render automatically provides `DATABASE_URL` environment variable with the connection string.

## 📊 Data Migration (If Needed)

### **MongoDB to PostgreSQL Migration Script:**
```python
# scripts/migrate_mongo_to_postgres.py
import asyncio
from backend.shared.database import DatabaseManager

async def migrate_data():
    # Connect to both databases
    mongo_db = DatabaseManager()
    mongo_db.db_type = 'mongodb'
    await mongo_db.connect()
    
    postgres_db = DatabaseManager()
    postgres_db.db_type = 'postgresql'
    await postgres_db.connect()
    
    # Migrate collections
    collections = ['ingestion_jobs', 'processed_features', 'predictions']
    
    for collection in collections:
        print(f"Migrating {collection}...")
        documents = await mongo_db.find_documents(collection)
        
        for doc in documents:
            # Remove MongoDB _id field
            if '_id' in doc:
                del doc['_id']
            
            # Insert into PostgreSQL
            await postgres_db.insert_document(collection, doc)
        
        print(f"Migrated {len(documents)} documents from {collection}")

if __name__ == "__main__":
    asyncio.run(migrate_data())
```

## 🔍 Verification

### **1. Check Database Connection**
```bash
# Test PostgreSQL connection
curl https://superpage-ingestion.onrender.com/health

# Should return:
{
  "status": "ok",
  "service": "ingestion-service",
  "dependencies": {
    "database": true
  }
}
```

### **2. Verify Tables**
```sql
-- Connect to database
psql $DATABASE_URL

-- List tables
\dt

-- Check sample data
SELECT * FROM projects LIMIT 5;
SELECT * FROM project_summary LIMIT 5;
```

## 🎯 Benefits of PostgreSQL

### **✅ Advantages:**
- **Integrated with Render**: Automatic connection strings
- **ACID Compliance**: Better data consistency
- **SQL Queries**: Familiar query language
- **JSON Support**: JSONB for flexible data
- **Performance**: Optimized for relational data
- **Backup/Recovery**: Built-in Render backup
- **Monitoring**: Render dashboard integration

### **📊 Performance:**
- **Indexes**: Optimized for common queries
- **JSONB**: Fast JSON operations
- **Views**: Pre-computed joins
- **Triggers**: Automatic timestamp updates

## 🔧 Development

### **Local Development:**
```bash
# Use Docker for local PostgreSQL
docker run -d \
  --name superpage-postgres \
  -e POSTGRES_DB=superpage \
  -e POSTGRES_USER=superpage_user \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:15

# Set environment variable
export DATABASE_URL=postgresql://superpage_user:password@localhost:5432/superpage

# Run schema setup
psql $DATABASE_URL -f scripts/setup-postgres-schema.sql
```

### **Testing:**
```bash
# Run tests with PostgreSQL
export DATABASE_URL=postgresql://test_user:password@localhost:5432/test_superpage
pytest backend/*/tests/
```

## 📞 Support

### **Common Issues:**

**❌ "relation does not exist"**
- Run schema setup script: `psql $DATABASE_URL -f scripts/setup-postgres-schema.sql`

**❌ "connection refused"**
- Check DATABASE_URL environment variable
- Verify Render database is running

**❌ "permission denied"**
- Check database user permissions
- Verify connection string format

### **Monitoring:**
- **Render Dashboard**: Database metrics and logs
- **Health Endpoints**: Service-level database status
- **Application Logs**: Database connection status

---

**🎉 PostgreSQL migration provides better integration with Render and improved performance for SuperPage!**
