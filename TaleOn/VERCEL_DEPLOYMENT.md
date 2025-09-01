# 🚀 Vercel Deployment Guide for TaleOn

This guide will help you deploy the TaleOn frontend to Vercel and connect it to your backend.

## 📋 Prerequisites

- **Vercel account** (free tier available)
- **GitHub repository** with your TaleOn project
- **Backend API** deployed and accessible (Railway, Render, Heroku, etc.)

## 🔧 Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your repository structure looks like this:
```
TaleOn/
├── taleon/                 # Frontend (this is what we deploy to Vercel)
│   ├── src/
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json
│   └── env.vercel.template
├── taleon-backend/         # Backend (deploy separately)
└── README.md
```

### 2. Deploy Frontend to Vercel

#### Option A: Deploy via Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure the project:**
   - **Framework Preset**: Vite
   - **Root Directory**: `taleon`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd taleon

# Deploy
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Set root directory to current directory
# - Confirm build settings
```

### 3. Configure Environment Variables

In your Vercel project dashboard:

1. **Go to Settings → Environment Variables**
2. **Add the following variables:**

```env
# Required
VITE_API_URL=https://your-backend-domain.com
VITE_SOCKET_URL=https://your-backend-domain.com

# Optional
VITE_APP_NAME=TaleOn
VITE_APP_VERSION=1.0.0
```

**Important**: Replace `your-backend-domain.com` with your actual backend URL.

### 4. Deploy Backend (Separate Service)

You'll need to deploy your backend to a separate service. Recommended options:

#### Railway (Recommended)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Navigate to backend
cd taleon-backend

# Deploy
railway login
railway init
railway up
```

#### Render
- Create a new Web Service
- Connect your GitHub repository
- Set root directory to `taleon-backend`
- Build command: `npm install`
- Start command: `npm start`

#### Heroku
```bash
# Navigate to backend
cd taleon-backend

# Create Heroku app
heroku create your-taleon-backend

# Add MongoDB addon
heroku addons:create mongolab

# Deploy
git push heroku main
```

### 5. Update Environment Variables

After deploying your backend, update the Vercel environment variables with your actual backend URL:

```env
VITE_API_URL=https://your-backend-app.railway.app
VITE_SOCKET_URL=https://your-backend-app.railway.app
```

### 6. Configure CORS on Backend

Make sure your backend allows requests from your Vercel domain:

```javascript
// In your backend CORS configuration
const allowedOrigins = [
  'https://your-app.vercel.app',
  'http://localhost:3000' // for development
];
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs in Vercel dashboard
# Common fixes:
npm install --legacy-peer-deps
# or
npm install --force
```

#### 2. Environment Variables Not Working
- Ensure variables start with `VITE_`
- Redeploy after adding variables
- Check variable names are correct

#### 3. API Connection Issues
- Verify backend URL is correct
- Check CORS configuration
- Ensure backend is running

#### 4. React Errors
- Check browser console for specific errors
- Verify all imports are correct
- Ensure no infinite loops in useEffect

### Debug Commands

```bash
# Test build locally
npm run build

# Test preview
npm run preview

# Check environment variables
echo $VITE_API_URL

# Test API connection
curl https://your-backend-url.com/health
```

## 🌐 Custom Domain (Optional)

1. **Go to Vercel Dashboard → Domains**
2. **Add your custom domain**
3. **Update DNS records** as instructed
4. **Update environment variables** with new domain

## 📊 Monitoring

### Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor performance and errors

### Health Checks
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend-url.com/health`

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to your main branch:

```bash
# Make changes
git add .
git commit -m "Update for Vercel deployment"
git push origin main

# Vercel will automatically deploy
```

## 🚨 Important Notes

### Environment Variables
- ✅ Always use `VITE_` prefix for client-side variables
- ✅ Never commit sensitive data to repository
- ✅ Use Vercel's environment variable system

### Build Optimization
- ✅ Vercel automatically optimizes builds
- ✅ Use code splitting for better performance
- ✅ Minimize bundle size

### Security
- ✅ Enable HTTPS (automatic on Vercel)
- ✅ Configure proper CORS headers
- ✅ Use environment variables for secrets

## 🆘 Support

If you encounter issues:

1. **Check Vercel build logs**
2. **Review browser console errors**
3. **Verify environment variables**
4. **Test API connectivity**
5. **Check CORS configuration**

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Configuration](https://vitejs.dev/config/)
- [React Deployment](https://reactjs.org/docs/optimizing-performance.html)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Happy Deploying! 🎉**
