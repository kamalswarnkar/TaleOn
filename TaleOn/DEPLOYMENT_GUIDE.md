# TaleOn Deployment Guide

This guide will help you deploy TaleOn to production with proper configuration and security.

## Prerequisites

- Docker and Docker Compose installed
- A domain name (for production)
- MongoDB database (local or cloud)
- Email service credentials (optional)
- Google OAuth credentials (optional)
- Groq API key (required for AI functionality)

## Quick Start

### 1. Environment Setup

```bash
# Copy environment templates
cp taleon/env.production.template taleon/.env
cp taleon-backend/env.production.template taleon-backend/.env

# Edit the files with your actual values
nano taleon/.env
nano taleon-backend/.env
```

### 2. Validate Configuration

```bash
# Linux/Mac
./validate-env.sh

# Windows
validate-env.bat
```

### 3. Deploy

```bash
# Start all services
docker-compose up -d

# Check health
curl http://127.0.0.1:5000/health
curl http://127.0.0.1:3000/health
```

## Required Environment Variables

### Backend (.env in taleon-backend/)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/taleon` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `your_super_secure_jwt_secret_key_here_minimum_32_characters` |
| `SESSION_SECRET` | Session secret (32+ chars) | `your_super_secure_session_secret_here_minimum_32_characters` |
| `GROQ_API_KEY` | Groq API key for AI | `gsk_...` |
| `FRONTEND_URL` | Frontend domain | `https://yourdomain.com` |

### Frontend (.env in taleon/)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.yourdomain.com` |
| `VITE_SOCKET_URL` | WebSocket URL | `https://api.yourdomain.com` |

## Optional Environment Variables

### Email Service (for password reset)

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_USER` | Email username | `your_email@gmail.com` |
| `EMAIL_PASS` | Email password/app password | `your_app_password` |
| `FROM_NAME` | Sender name | `TaleOn` |
| `FROM_EMAIL` | Sender email | `noreply@yourdomain.com` |

### Google OAuth (for social login)

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-...` |

### Alternative AI Service

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |

## Production Deployment

### 1. Domain Setup

1. Point your domain to your server's IP address
2. Set up SSL certificates (Let's Encrypt recommended)
3. Configure your reverse proxy (nginx/Apache)

### 2. Database Setup

#### MongoDB Atlas (Recommended)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist your server's IP
5. Get the connection string

#### Local MongoDB
```bash
# Using Docker
docker run -d --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7.0
```

### 3. SSL Configuration

Update your nginx configuration to include SSL:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Your existing configuration
}
```

### 4. Environment Variables for Production

Create production environment files:

```bash
# Backend
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/taleon?retryWrites=true&w=majority
JWT_SECRET=your_very_secure_jwt_secret_here_minimum_32_characters_long
SESSION_SECRET=your_very_secure_session_secret_here_minimum_32_characters_long
GROQ_API_KEY=your_groq_api_key_here
FRONTEND_URL=https://yourdomain.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FROM_NAME=TaleOn
FROM_EMAIL=noreply@yourdomain.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Frontend
VITE_API_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://api.yourdomain.com
```

## Security Best Practices

### 1. Secrets Management
- Use strong, unique secrets (32+ characters)
- Generate secrets using: `openssl rand -base64 32`
- Never commit secrets to version control
- Use environment variables or secret management services

### 2. Database Security
- Use strong database passwords
- Enable MongoDB authentication
- Whitelist only necessary IP addresses
- Use SSL/TLS for database connections

### 3. Network Security
- Use HTTPS in production
- Configure proper CORS settings
- Set up rate limiting
- Use security headers

### 4. Application Security
- Keep dependencies updated
- Use non-root users in containers
- Enable health checks
- Monitor logs and metrics

## Monitoring and Maintenance

### Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/health

# Frontend health
curl https://yourdomain.com/health
```

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Check health after update
curl https://api.yourdomain.com/health
```

## Troubleshooting

### Common Issues

1. **Environment variables not loaded**
   - Check file paths and names
   - Ensure no spaces around `=`
   - Restart containers after changes

2. **Database connection failed**
   - Verify MongoDB URI format
   - Check network connectivity
   - Verify credentials and permissions

3. **CORS errors**
   - Ensure FRONTEND_URL is set correctly
   - Check that URLs match exactly
   - Verify HTTPS/HTTP protocol consistency

4. **Authentication issues**
   - Verify JWT_SECRET is set
   - Check token expiration settings
   - Ensure proper CORS configuration

### Debug Commands

```bash
# Check environment variables
docker-compose exec backend env | grep -E "(NODE_ENV|MONGODB_URI|JWT_SECRET)"

# Test database connection
docker-compose exec backend node -e "console.log(process.env.MONGODB_URI)"

# Check container status
docker-compose ps

# View container logs
docker-compose logs backend
```

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Validate environment: `./validate-env.sh`
3. Test health endpoints
4. Review this guide for common solutions

For additional help, check the troubleshooting endpoints:
- `/health` - Overall system health
- `/config` - Configuration status
- `/ready` - System readiness
- `/test-all` - Comprehensive tests
