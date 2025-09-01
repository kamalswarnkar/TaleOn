#!/bin/bash

# Quick Fix Script for Vercel Deployment Issues
echo "🔧 Applying Vercel deployment fixes..."

# 1. Clear node_modules and reinstall
echo "📦 Reinstalling dependencies..."
rm -rf node_modules package-lock.json
npm install

# 2. Test build
echo "🏗️ Testing build..."
npm run build

# 3. Check for common issues
echo "🔍 Checking for common issues..."

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found. Creating..."
    cat > vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
EOF
fi

# Check if environment template exists
if [ ! -f "env.vercel.template" ]; then
    echo "❌ Environment template not found. Creating..."
    cat > env.vercel.template << 'EOF'
# Vercel Environment Configuration
VITE_API_URL=https://your-backend-domain.com
VITE_SOCKET_URL=https://your-backend-domain.com
VITE_APP_NAME=TaleOn
VITE_APP_VERSION=1.0.0
EOF
fi

# 4. Check for problematic patterns
echo "🔍 Checking for problematic patterns..."

# Check for document.createElement usage
if grep -r "document.createElement" src/; then
    echo "⚠️ Found document.createElement usage. Make sure it's wrapped in client-side check."
fi

# Check for window usage
if grep -r "window\." src/; then
    echo "⚠️ Found window usage. Make sure it's wrapped in client-side check."
fi

# 5. Create .vercelignore if needed
if [ ! -f ".vercelignore" ]; then
    echo "📝 Creating .vercelignore..."
    cat > .vercelignore << 'EOF'
node_modules
.env
.env.local
.env.production
.env.development
*.log
.DS_Store
Thumbs.db
EOF
fi

echo "✅ Vercel fixes applied!"
echo ""
echo "📋 Next steps:"
echo "1. Commit and push your changes"
echo "2. Deploy to Vercel"
echo "3. Set environment variables in Vercel dashboard"
echo "4. Test your application"
echo ""
echo "🔗 Vercel Dashboard: https://vercel.com/dashboard"
