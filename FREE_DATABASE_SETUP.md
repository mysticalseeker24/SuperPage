# 🆓 Free Database Setup Guide for SuperPage

## Why External Database?

Render requires **payment information** even for free PostgreSQL databases. To avoid this, we'll use external free database services that don't require payment details.

## 🎯 Recommended: MongoDB Atlas (Free Tier)

### **Why MongoDB Atlas?**
- ✅ **512MB free storage** (sufficient for development)
- ✅ **No payment info required**
- ✅ **Global clusters available**
- ✅ **Built-in security and monitoring**
- ✅ **SuperPage already supports MongoDB**

### **Setup Steps:**

#### **1. Create MongoDB Atlas Account**
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Click **"Try Free"**
3. Sign up with email (no payment info needed)

#### **2. Create Free Cluster**
1. **Choose deployment**: Select **"M0 Sandbox"** (Free tier)
2. **Cloud Provider**: AWS, Google Cloud, or Azure
3. **Region**: Choose closest to your users
4. **Cluster Name**: `superpage-cluster`
5. Click **"Create Deployment"**

#### **3. Configure Database Access**
1. **Database Access** → **Add New Database User**
2. **Username**: `superpage_user`
3. **Password**: Generate secure password (save it!)
4. **Database User Privileges**: Read and write to any database
5. Click **"Add User"**

#### **4. Configure Network Access**
1. **Network Access** → **Add IP Address**
2. **Access List Entry**: `0.0.0.0/0` (Allow access from anywhere)
3. **Comment**: "Render deployment access"
4. Click **"Confirm"**

#### **5. Get Connection String**
1. **Database** → **Connect** → **Drivers**
2. **Driver**: Python, Version 3.6 or later
3. **Copy connection string**:
```
mongodb+srv://superpage_user:<password>@superpage-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
4. Replace `<password>` with your actual password

## 🔄 Alternative: Supabase PostgreSQL (Free Tier)

### **Why Supabase?**
- ✅ **500MB free storage**
- ✅ **PostgreSQL compatible**
- ✅ **No payment info required**
- ✅ **Built-in API and dashboard**

### **Setup Steps:**

#### **1. Create Supabase Account**
1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (no payment info needed)

#### **2. Create New Project**
1. **Organization**: Create new or use existing
2. **Project Name**: `superpage-db`
3. **Database Password**: Generate secure password
4. **Region**: Choose closest to your users
5. Click **"Create new project"**

#### **3. Get Connection Details**
1. **Settings** → **Database**
2. **Connection string**:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

#### **4. Run Schema Setup**
1. **SQL Editor** in Supabase dashboard
2. Copy and paste contents of `scripts/setup-postgres-schema.sql`
3. Click **"Run"**

## 🚀 Configure Render Services

### **Update Environment Variables**

For each Render service, set the `DATABASE_URL` environment variable:

#### **MongoDB Atlas:**
```bash
DATABASE_URL=mongodb+srv://superpage_user:YOUR_PASSWORD@superpage-cluster.xxxxx.mongodb.net/superpage?retryWrites=true&w=majority
```

#### **Supabase PostgreSQL:**
```bash
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres
```

### **Steps in Render Dashboard:**
1. Go to each service (ingestion, preprocessing, etc.)
2. **Environment** tab
3. **Add Environment Variable**:
   - **Key**: `DATABASE_URL`
   - **Value**: Your connection string
4. **Save Changes**
5. Service will automatically redeploy

## 📊 Database Comparison

| Feature | MongoDB Atlas | Supabase | Render PostgreSQL |
|---------|---------------|----------|-------------------|
| **Storage** | 512MB | 500MB | 1GB |
| **Payment Info** | ❌ Not Required | ❌ Not Required | ✅ Required |
| **Expiration** | Never | Never | 30 days |
| **Backup** | ✅ Included | ✅ Included | ❌ Not available |
| **Monitoring** | ✅ Built-in | ✅ Built-in | ✅ Basic |
| **API Access** | ✅ REST/GraphQL | ✅ REST/GraphQL | ❌ SQL only |

## 🔧 Code Compatibility

SuperPage's database abstraction layer automatically detects the database type:

```python
# Automatic detection based on environment variables
if os.getenv('DATABASE_URL'):
    if 'mongodb' in DATABASE_URL:
        # Use MongoDB driver
    elif 'postgresql' in DATABASE_URL:
        # Use PostgreSQL driver
```

## 🧪 Testing Database Connection

### **Test MongoDB Atlas:**
```bash
# Install MongoDB client
pip install pymongo

# Test connection
python -c "
import pymongo
client = pymongo.MongoClient('YOUR_MONGODB_URL')
print('Connected to MongoDB:', client.server_info()['version'])
"
```

### **Test Supabase PostgreSQL:**
```bash
# Install PostgreSQL client
pip install psycopg2-binary

# Test connection
python -c "
import psycopg2
conn = psycopg2.connect('YOUR_POSTGRESQL_URL')
print('Connected to PostgreSQL:', conn.get_dsn_parameters()['dbname'])
"
```

## 🔍 Monitoring & Maintenance

### **MongoDB Atlas:**
- **Dashboard**: Real-time metrics and alerts
- **Performance Advisor**: Query optimization suggestions
- **Profiler**: Slow query analysis

### **Supabase:**
- **Dashboard**: Database metrics and logs
- **Table Editor**: Visual data management
- **API Logs**: Request monitoring

## 🚨 Important Notes

### **Security:**
- ✅ Use strong passwords for database users
- ✅ Rotate passwords regularly
- ✅ Monitor access logs
- ❌ Never commit connection strings to code

### **Limitations:**
- **MongoDB Atlas Free**: 512MB storage, shared clusters
- **Supabase Free**: 500MB storage, 2 projects max
- **Both**: No SLA guarantees on free tier

### **Scaling:**
- Start with free tier for development
- Upgrade to paid plans for production
- Monitor storage usage regularly

## 📞 Support

### **MongoDB Atlas:**
- **Documentation**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Community**: [community.mongodb.com](https://community.mongodb.com)

### **Supabase:**
- **Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)

---

**🎉 With external free databases, you can deploy SuperPage without any payment information required!**

**Recommended Setup:**
1. **MongoDB Atlas** for simplicity (SuperPage already supports it)
2. **Supabase** if you prefer PostgreSQL
3. **Both** for testing database abstraction layer
