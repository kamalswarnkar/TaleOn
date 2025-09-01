# 🚀 TaleOn Backend

A collaborative storytelling game backend with AI-powered judgement, real-time multiplayer, and secure authentication.

## ✨ **Recent Updates & Fixes**

### **🎯 Archive System Fixed**
- ✅ **Count Consistency**: Archive page now shows accurate WIN/LOSE/PENDING counts
- ✅ **Pagination**: Increased "ALL" filter limit from 25 to 100 games
- ✅ **Date Format**: Changed to DD-month-YYYY format (e.g., "15-Jan-2024")
- ✅ **Verdict Tracking**: Games properly move from PENDING to WIN/LOSE

### **🧠 AI Judgement Improved**
- ✅ **Consistency**: Same story now gets same verdict every time
- ✅ **Deterministic**: Reduced AI temperature for consistent responses
- ✅ **Verdict Caching**: Prevents re-judging on page refresh
- ✅ **Quality Detection**: Better gibberish detection with fair judgement

### **🔐 Security & Authentication**
- ✅ **JWT Socket Auth**: Real-time connections now properly authenticated
- ✅ **Host-Only Permissions**: Only room hosts can start games
- ✅ **Password Reset**: Complete forgot/reset password flow
- ✅ **CORS Fixed**: Properly configured for port 5173

## **Quick Start**

### **Option 1: Automatic Port Management (Recommended)**
```bash
# PowerShell (Windows)
npm run clean-start

# OR Batch file (Windows)
npm run clean-start-bat
```

### **Option 2: Manual Start**
```bash
npm run dev
```

### **Option 3: Production Start**
```bash
npm start
```

## **🔧 Environment Setup**

### **Required Environment Variables**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# AI Services
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key (optional)
USE_OPENAI=false

# Frontend
FRONTEND_URL=http://localhost:5173

# Email (for password reset)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FROM_NAME=TaleOn
FROM_EMAIL=noreply@yourdomain.com
```

## **📧 Email Configuration Guide**

### **Gmail Setup (Recommended)**
1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account Settings → Security
   - Find "2-Step Verification" → "App passwords"
   - Select "Mail" and generate password
3. **Use App Password** in your `.env` file (NOT your regular password)

### **Your Current Email Config Issues**
```env
# ❌ This won't work:
EMAIL_PASS=kamal@284

# ✅ Use App Password instead:
EMAIL_PASS=abcd efgh ijkl mnop
```

### **Complete Email Setup**
```env
EMAIL_USER=kamalswarnkar284@gmail.com
EMAIL_PASS=your_16_character_app_password
FROM_NAME=TaleOn
FROM_EMAIL=kamalswarnkar284@gmail.com  # Use your actual email
```

### **Testing Email**
```bash
# Check if email is working
curl -X POST http://localhost:5000/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"kamalswarnkar284@gmail.com"}'
```

## **🚀 Production Deployment**

### **Environment Setup**
```bash
# Copy production template
cp env.production.example .env

# Edit with your values
nano .env
```

### **Deploy Commands**
```bash
# Install production dependencies
npm ci --only=production

# Start production server
NODE_ENV=production npm start
```

## **🚨 Troubleshooting**

### **Port 5000 Already in Use Error**
```bash
# Quick Fix
npm run clean-start

# Manual Fix
taskkill /F /IM node.exe
npm run dev
```

### **Email Not Working**
1. **Check App Password**: Ensure you're using Gmail App Password, not regular password
2. **Verify 2FA**: Make sure 2-Factor Authentication is enabled
3. **Check .env**: Ensure all email variables are set correctly
4. **Test Connection**: Use the debug endpoint to test email setup

### **Archive Counts Wrong**
1. **Clear Browser Cache**: Hard refresh the archive page
2. **Check Backend Logs**: Look for `[ARCHIVE]` debug messages
3. **Verify Database**: Check if games have proper verdicts

### **AI Judgement Inconsistent**
1. **Check Temperature**: Backend uses 0.1 for consistency
2. **Verify Caching**: Same story should get same verdict
3. **Clear Session**: Use "Reset Judgement" button if needed

## **🔒 Security Features**

### **✅ Implemented:**
- **JWT Socket Authentication**: Real-time connections authenticated
- **Host-Only Permissions**: Server-side enforcement of game controls
- **CORS Protection**: Restricted to allowed origins (localhost:5173)
- **Security Headers**: XSS, CSRF, and content type protection
- **Input Validation**: Request size limits and sanitization
- **Environment Isolation**: Production vs development configs
- **Error Handling**: Secure error messages in production

### **🔧 Configuration:**
- **Development**: Allows localhost:5173 origin
- **Production**: Restricts to specified frontend domain
- **Security Headers**: Automatic protection headers
- **Rate Limiting**: Configurable request limits

## **📁 File Structure**
```
src/
├── app.js                 # Main application setup
├── server.js             # Server entry point
├── config/
│   └── db.js            # Database connection
│   ├── passport.js 
├── controllers/
│   └── authController.js # Authentication logic
├── middleware/
│   └── authMiddleware.js # JWT verification
├── models/
│   ├── Game.js          # Game data model
│   ├── Room.js          # Room management
│   └── User.js          # User accounts
├── routes/
│   ├── authRoutes.js    # Authentication endpoints
│   ├── gameRoutes.js    # Game management
│   └── roomRoutes.js    # Room operations
└── sockets/
    └── gameSocket.js     # Real-time game events
```

## **🔄 API Endpoints**

### **Authentication**
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password/:token` - Password reset

### **Rooms**
- `POST /room/create` - Create new room
- `GET /room/:roomCode` - Get room details
- `POST /room/join` - Join existing room

### **Games**
- `POST /game/start` - Start new game
- `POST /game/turn` - Submit story turn
- `POST /game/judgement` - Get AI judgement
- `POST /game/roast` - Generate AI roasts
- `GET /game/archive` - Get game history
- `GET /game/debug/counts` - Debug game counts

## **🧪 Testing & Debug**

### **Debug Endpoints**
```bash
# Check game counts
GET /game/debug/counts

# Test email setup
POST /auth/forgot-password
```

### **Common Test Scenarios**
1. **Create Room** → **Join Room** → **Start Game** → **Play Turns** → **Get Judgement**
2. **Archive Page** → **Check Counts** → **Verify Verdicts**
3. **Password Reset** → **Check Email** → **Reset Password**

## **📚 Dependencies**

### **Core**
- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens

### **AI Services**
- **Groq API** - Story generation and judgement
- **OpenAI API** - Alternative AI service (optional)

### **Email**
- **Nodemailer** - Email sending
- **Gmail SMTP** - Email provider

## **🤝 Contributing**

1. **Fork** the repository
2. **Create** feature branch
3. **Test** thoroughly
4. **Submit** pull request

## **📄 License**

This project is licensed under the MIT License.

---

**🎮 Happy Storytelling!** Keep the tale going... or get roasted together!
