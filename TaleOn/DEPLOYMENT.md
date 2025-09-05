# 🚀 TaleOn Deployment Guide

This guide will help you deploy TaleOn to production using Docker and Docker Compose.

## 📋 Prerequisites

- **Docker Desktop** installed and running
- **Docker Compose** (included with Docker Desktop)
- **MongoDB Atlas account** (or local MongoDB)
- **Groq API key** for AI features
- **Domain name** (for production deployment)

## 🔧 Quick Deployment

### 1. Clone and Navigate
```bash
git clone <your-repo-url>
cd TaleOn
```

### 2. Set Environment Variables
```bash
# Copy the production template
cp taleon-backend/env.production.template .env

# Edit .env with your actual values
nano .env  # or use your preferred editor
```

### 3. Deploy
```bash
# On Linux/Mac
chmod +x deploy.sh
./deploy.sh

# On Windows
deploy.bat
```

## 🌍 Production Environment Setup

### Required Environment Variables

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database (MongoDB Atlas recommended for production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taleon

# JWT Authentication (generate secure random strings)
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
SESSION_SECRET=your_super_secure_session_secret_here_minimum_32_characters

# AI Service
GROQ_API_KEY=your_groq_api_key_here

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Email Configuration (for password reset)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
FROM_NAME=TaleOn
FROM_EMAIL=noreply@yourdomain.com

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Frontend Environment Variables

```env
# Create taleon/.env
VITE_API_URL=https://your-api-domain.com
VITE_SOCKET_URL=https://your-api-domain.com
```

## 🐳 Docker Deployment

### Manual Docker Commands

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Update services
docker-compose up -d --build
```

### Service Health Checks

```bash
# Backend health
curl http://127.0.0.1:5000/health

# Frontend health
curl http://127.0.0.1:3000/health

# MongoDB connection
docker-compose exec backend node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('MongoDB connected'); process.exit(0); })
  .catch(err => { console.error('MongoDB connection failed:', err); process.exit(1); });
"
```

## 🌐 Production Domain Setup

### 1. DNS Configuration
Point your domain to your server's IP address:
```
A    yourdomain.com        → YOUR_SERVER_IP
A    api.yourdomain.com    → YOUR_SERVER_IP
```

### 2. SSL Certificate
```bash
# Generate SSL certificate (Let's Encrypt)
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Copy certificates to nginx
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/key.pem
```

### 3. Production Nginx
```bash
# Start with production profile
docker-compose --profile production up -d
```

## 📊 Monitoring and Maintenance

### Health Monitoring
- **Backend**: `/health`, `/status`, `/ready`
- **Frontend**: `/health`
- **Database**: MongoDB connection status
- **Logs**: `docker-compose logs -f`

### Backup Strategy
```bash
# MongoDB backup
docker-compose exec mongodb mongodump --out /backup/$(date +%Y%m%d)

# Application backup
tar -czf taleon-backup-$(date +%Y%m%d).tar.gz ./
```

### Update Process
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Verify health
curl http://127.0.0.1:5000/health
curl http://127.0.0.1:3000/health
```

## 🔒 Security Considerations

### Environment Variables
- ✅ Use strong, unique secrets for JWT and sessions
- ✅ Never commit `.env` files to version control
- ✅ Rotate secrets regularly in production

### Network Security
- ✅ Use HTTPS in production
- ✅ Configure firewall rules
- ✅ Enable rate limiting
- ✅ Set up proper CORS policies

### Database Security
- ✅ Use MongoDB Atlas with network access controls
- ✅ Enable authentication and authorization
- ✅ Regular security updates

## 🚨 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```bash
# Check MongoDB container
docker-compose logs mongodb

# Verify connection string
docker-compose exec backend env | grep MONGODB_URI
```

#### 2. Backend Health Check Fails
```bash
# Check backend logs
docker-compose logs backend

# Verify environment variables
docker-compose exec backend env | grep -E "(JWT_SECRET|SESSION_SECRET)"
```

#### 3. Frontend Not Loading
```bash
# Check frontend logs
docker-compose logs frontend

# Verify API URL configuration
docker-compose exec frontend env | grep VITE_API_URL
```

#### 4. Port Already in Use
```bash
# Check what's using the port
netstat -tulpn | grep :5000

# Stop conflicting services
sudo systemctl stop conflicting-service
```

### Debug Commands
```bash
# Check all container statuses
docker-compose ps

# View real-time logs
docker-compose logs -f --tail=100

# Execute commands in containers
docker-compose exec backend node -e "console.log(process.env.NODE_ENV)"
docker-compose exec frontend sh -c "echo $VITE_API_URL"
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt SSL](https://letsencrypt.org/docs/)

## 🆘 Support

If you encounter issues during deployment:

1. Check the troubleshooting section above
2. Review container logs: `docker-compose logs -f`
3. Verify environment variables are set correctly
4. Ensure all prerequisites are met
5. Check the [TROUBLESHOOTING.md](TROUBLESHOOTING.md) file

---

**Happy Deploying! 🎉**


