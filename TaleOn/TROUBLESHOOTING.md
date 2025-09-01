# 🔧 TaleOn Troubleshooting Guide

This guide helps you resolve common issues with TaleOn.

## 📧 Email Issues

### "Email link wasn't sent successfully"

**Cause**: Email configuration is missing or incorrect.

**Solution**:
1. Ensure you have a `.env` file in the backend directory
2. Configure email settings in `.env`:
   ```env
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password_here
   FROM_NAME=TaleOn Dev
   FROM_EMAIL=noreply@yourdomain.com
   ```
3. For Gmail, you need an App Password:
   - Go to Google Account Settings
   - Security > 2-Step Verification > App passwords
   - Generate a new app password
   - Use this password in `EMAIL_PASS`

## 🎮 Game Issues

### "No matches in archive page"

**Cause**: Games might not have verdicts or the filter is too restrictive.

**Solution**:
1. Check if you have completed games
2. Use the "Pending" filter to see games without verdicts
3. Ensure games have been judged (completed the story)

### "Can't rejoin after clicking back to home"

**Cause**: Session data not properly cleared.

**Solution**:
1. Click "Dismiss" in the rejoin modal to clear session data
2. Or manually clear browser session storage
3. Try refreshing the page

### "New players can't join active games"

**Cause**: This feature is now implemented - new players should automatically join.

**Solution**:
1. Ensure the room is still active
2. Check that the game hasn't ended
3. New players will be added to the end of the turn cycle

## 🤖 AI Issues

### "Verdict system not powered by AI"

**Cause**: Missing or invalid Groq API key.

**Solution**:
1. Get a free API key from [Groq Console](https://console.groq.com/)
2. Add it to your `.env` file:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```
3. Restart the backend server

### "Roast not working"

**Cause**: Same as above - missing Groq API key.

**Solution**: Follow the same steps as for verdict system.

## 🗄️ Database Issues

### "Connection failed"

**Cause**: MongoDB not running or wrong connection string.

**Solution**:
1. For local MongoDB:
   ```bash
   # Start MongoDB
   mongod
   ```
2. For MongoDB Atlas:
   - Get connection string from Atlas dashboard
   - Update `MONGODB_URI` in `.env`

## 🔐 Authentication Issues

### "JWT errors"

**Cause**: Missing or weak JWT secret.

**Solution**:
1. Ensure `JWT_SECRET` is set in `.env`
2. Use a strong, random secret (32+ characters)
3. Run `npm run setup` to generate a secure secret

## 🚀 Setup Issues

### "Environment variables not working"

**Solution**:
1. Create a `.env` file in the backend directory
2. Copy the environment configuration from the README
3. Add your actual values for API keys and email settings
4. Restart the server

### "Dependencies not found"

**Solution**:
1. Install dependencies:
   ```bash
   # Backend
   cd taleon-backend
   npm install
   
   # Frontend
   cd ../taleon
   npm install
   ```

## 🔍 Debug Mode

Enable debug logging by setting in `.env`:
```env
LOG_LEVEL=debug
```

This will show detailed logs for:
- AI API calls
- Socket connections
- Database operations
- Authentication events

## 📞 Getting Help

If you're still having issues:

1. Check the browser console for errors
2. Check the backend logs for errors
3. Ensure all environment variables are set
4. Verify your API keys are valid
5. Check that MongoDB is running

## 🧪 Testing Checklist

Before reporting issues, verify:

- [ ] `.env` file exists and is configured
- [ ] MongoDB is running and accessible
- [ ] Groq API key is valid
- [ ] Email credentials are correct (if using password reset)
- [ ] Both frontend and backend are running
- [ ] No firewall blocking connections
- [ ] Browser console has no errors
- [ ] Backend logs show no errors
