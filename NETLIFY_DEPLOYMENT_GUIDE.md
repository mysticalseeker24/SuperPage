# 🎨 Netlify Frontend Deployment Guide

## 🌐 Deploy SuperPage Frontend to Netlify

Since your Railway backend is already deployed, now let's deploy the React frontend to Netlify for a complete production setup.

## 🚀 Step-by-Step Netlify Deployment

### **Step 1: Create Netlify Account**

1. Go to [netlify.com](https://netlify.com)
2. **Sign up** with your GitHub account
3. **Authorize** Netlify to access your repositories

### **Step 2: Deploy from GitHub**

1. **New site from Git** → **GitHub**
2. **Select repository**: `mysticalseeker24/SuperPage`
3. **Configure build settings**:

#### **Build Settings:**
```bash
# Base directory
frontend

# Build command
npm ci && npm run build

# Publish directory
frontend/dist

# Node.js version
18.19.0
```

**Note**: The build command `npm ci && npm run build` ensures all dependencies (including devDependencies) are installed before building.

### **Step 3: Environment Variables**

Add these environment variables in Netlify dashboard:

#### **Site Settings → Environment Variables:**

```bash
# Backend API URLs (Railway services)
VITE_API_URL=https://superpage-ingestion.up.railway.app
VITE_PREDICTION_API_URL=https://superpage-prediction.up.railway.app
VITE_BLOCKCHAIN_API_URL=https://superpage-blockchain.up.railway.app
VITE_PREPROCESSING_API_URL=https://superpage-preprocessing.up.railway.app

# Blockchain Configuration
VITE_BLOCKCHAIN_NETWORK_URL=https://sepolia.infura.io/v3/ea1e0f21469f412995bdaaa76ac1c266
VITE_SUPERPAGE_CONTRACT_ADDRESS=0x45341d82d59b3C4C43101782d97a4dBb97a42dba
VITE_INFURA_PROJECT_ID=ea1e0f21469f412995bdaaa76ac1c266

# Application Configuration
VITE_APP_NAME=SuperPage
VITE_APP_VERSION=1.0.0
```

### **Step 4: Deploy Configuration**

Netlify will automatically detect the `netlify.toml` file in your repository:

```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18.19.0"
  NPM_VERSION = "10.2.4"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### **Step 5: Custom Domain (Optional)**

1. **Domain settings** → **Add custom domain**
2. **Configure DNS** with your domain provider
3. **Enable HTTPS** (automatic with Netlify)

## 🔧 Build Configuration

### **Package.json Dependencies**

Ensure Vite is in dependencies (not devDependencies) for Netlify builds:

```json
{
  "dependencies": {
    "vite": "^5.0.8",
    "@vitejs/plugin-react": "^4.2.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

**Important**: Vite must be in `dependencies` (not `devDependencies`) for Netlify to find it during build.

### **Vite Configuration**

Your `frontend/vite.config.js` should be configured for production:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          web3: ['ethers']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
})
```

## 🔍 Verification Steps

### **1. Check Deployment Status**

1. Go to **Deploys** tab in Netlify dashboard
2. Verify **Deploy log** shows successful build
3. Check **Functions** tab (should be empty for this project)

### **2. Test Frontend Functionality**

```bash
# Test the deployed frontend
curl https://your-site-name.netlify.app

# Should return HTML content with React app
```

### **3. Verify API Connections**

1. Open browser developer tools
2. Go to your Netlify site
3. Check **Network** tab for API calls to Railway services
4. Verify **Console** shows no CORS errors

### **4. Test MetaMask Integration**

1. Visit your Netlify site
2. Connect MetaMask wallet
3. Verify wallet authentication works
4. Test prediction functionality

## 🚨 Troubleshooting

### **Common Issues:**

#### **❌ "Build failed" / "vite: not found"**
- **Fix build command**: Use `npm ci && npm run build` instead of `npm run build`
- **Move Vite to dependencies**: Ensure `vite` is in `dependencies`, not `devDependencies`
- **Check Node.js version**: Ensure it's 18.x
- **Verify package.json**: Run `npm install` locally first to test

#### **❌ "API calls failing"**
- **Verify environment variables**: Check Railway URLs are correct
- **CORS issues**: Ensure Railway services allow Netlify domain
- **Network errors**: Check Railway services are running

#### **❌ "MetaMask not connecting"**
- **HTTPS required**: Netlify provides automatic HTTPS
- **Check wallet extension**: Ensure MetaMask is installed
- **Network configuration**: Verify Sepolia testnet setup

#### **❌ "Routing not working"**
- **Check redirects**: Ensure `netlify.toml` has SPA redirect rule
- **Base path**: Verify Vite config has correct base path

### **Debug Commands:**

```bash
# Test build locally
cd frontend
npm install
npm run build
npm run preview

# Check environment variables
echo $VITE_API_URL

# Test API connectivity
curl https://superpage-ingestion.up.railway.app/health
```

## 📊 Performance Optimization

### **Build Optimizations:**

1. **Code Splitting**: Vite automatically splits vendor chunks
2. **Asset Optimization**: Images and assets are optimized
3. **Caching**: Static assets cached for 1 year
4. **Compression**: Netlify automatically compresses assets

### **Monitoring:**

1. **Netlify Analytics**: Built-in traffic and performance metrics
2. **Deploy Notifications**: Email/Slack notifications for deployments
3. **Form Handling**: Built-in form processing (if needed)

## 🔄 Continuous Deployment

### **Automatic Deployment:**

1. **Push to main branch** → Triggers Netlify build
2. **Build process** → Runs `npm run build` in frontend directory
3. **Deploy** → Updates live site automatically
4. **Notifications** → Email confirmation of deployment

### **Deploy Previews:**

1. **Pull Requests** → Automatic preview deployments
2. **Branch Deploys** → Deploy specific branches for testing
3. **Rollback** → Easy rollback to previous deployments

## 🎯 Final Checklist

- [ ] Netlify account created and connected to GitHub
- [ ] Repository selected and build settings configured
- [ ] Environment variables added with Railway URLs
- [ ] Deployment successful with green status
- [ ] Frontend accessible at Netlify URL
- [ ] MetaMask wallet connection working
- [ ] API calls to Railway backend successful
- [ ] Health checks passing for all services
- [ ] Custom domain configured (optional)
- [ ] HTTPS enabled and working

## 📞 Support

### **Netlify Resources:**
- **Documentation**: [docs.netlify.com](https://docs.netlify.com)
- **Support**: [support.netlify.com](https://support.netlify.com)
- **Community**: [community.netlify.com](https://community.netlify.com)

### **SuperPage Resources:**
- **Railway Backend**: `RAILWAY_QUICK_SETUP.md`
- **Commands Reference**: `RAILWAY_COMMANDS_CHEATSHEET.md`
- **Troubleshooting**: `RAILWAY_DOCKERFILE_FIX.md`

---

**🎉 Once deployed, your complete SuperPage application will be live with:**
- **Frontend**: `https://your-site-name.netlify.app`
- **Backend**: Railway microservices
- **Database**: Railway PostgreSQL
- **Blockchain**: Sepolia testnet integration
