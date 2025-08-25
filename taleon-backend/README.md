# 🚀 TaleOn Backend

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

## **🚀 Production Deployment**

### **Environment Setup**
```bash
# Copy production template
cp env.production.example .env

# Edit with your values
nano .env
```

### **Required Environment Variables**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
FRONTEND_URL=https://yourdomain.com
```

### **Deploy Commands**
```bash
# Install production dependencies
npm ci --only=production

# Start production server
NODE_ENV=production npm start
```

**📖 Full deployment guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

## **🚨 Troubleshooting**

### **Port 5000 Already in Use Error**
If you get `EADDRINUSE: address already in use :::5000`:

#### **Quick Fix:**
```bash
# Kill all Node processes
taskkill /F /IM node.exe

# Then start again
npm run dev
```

#### **Automatic Fix:**
Use the clean-start scripts above - they automatically handle port conflicts.

### **Manual Port Kill:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill specific process (replace PID with actual number)
taskkill /PID <PID> /F
```

## **🔒 Security Features**

### **✅ Implemented:**
- **CORS Protection**: Restricted to allowed origins
- **Security Headers**: XSS, CSRF, and content type protection
- **Input Validation**: Request size limits and sanitization
- **JWT Authentication**: Secure token-based auth
- **Environment Isolation**: Production vs development configs
- **Error Handling**: Secure error messages in production

### **🔧 Configuration:**
- **Development**: Allows localhost origins
- **Production**: Restricts to specified frontend domain
- **Security Headers**: Automatic protection headers
- **Rate Limiting**: Configurable request limits

## **📁 File Structure**
```
src/
├── server.js          # Main server file
├── app.js            # Express app configuration
├── config/
│   └── db.js        # Database connection
├── controllers/      # Route controllers
├── middleware/       # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
└── sockets/         # Socket.io handlers
```

## **🔧 Environment Variables**
Create a `.env` file in the root directory:
```env
# Development
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key

# Production (additional)
FRONTEND_URL=https://yourdomain.com
SESSION_SECRET=your_session_secret
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## **📡 API Endpoints**
- `POST /auth/signup` - User registration
- `POST /auth/login` - User authentication
- `POST /room/create` - Create game room
- `POST /room/join` - Join game room
- `POST /game/start` - Start game
- `POST /game/turn` - Submit story turn
- `POST /game/judgement` - AI story judgement
- `POST /game/leave` - Leave active game
- `GET /game/archive` - Get user game history

## **🎮 Game Flow**
1. User creates/joins room
2. Players wait in lobby
3. Host starts game
4. Turn-based storytelling
5. AI contributes turns
6. Story judgement
7. Results and archiving

## **🛠️ Development**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start with automatic port management
npm run clean-start

# Start production server
npm start
```

## **📝 Logs**
- Server logs appear in console
- Nodemon automatically restarts on file changes
- Check console for API request logs
- Production logging with structured format

## **🔍 Testing**
- **Postman Guide**: [POSTMAN_TESTING_GUIDE.md](./POSTMAN_TESTING_GUIDE.md)
- **API Testing**: Complete endpoint coverage
- **Game Flow Testing**: Full user journey validation
- **Error Handling**: Comprehensive error scenarios

---

**Happy Coding! 🎮✨**
