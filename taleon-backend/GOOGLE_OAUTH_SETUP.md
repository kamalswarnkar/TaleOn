# 🔐 Google OAuth Setup Guide for TaleOn

## **📋 Prerequisites**
- Google Developer Account
- Gmail account for sending emails
- Backend server running on localhost:5000

## **🚀 Step 1: Google Cloud Console Setup**

### **1.1 Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Name: `TaleOn` (or your preferred name)
4. Click **"Create"**

### **1.2 Enable Google+ API**
1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click **"Enable"**

### **1.3 Create OAuth 2.0 Credentials**
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. Application type: **"Web application"**
4. Name: `TaleOn Web Client`
5. **Authorized redirect URIs**:
   ```
   http://localhost:5000/auth/google/callback
   http://localhost:3000/auth/google/callback
   ```
6. Click **"Create"**
7. **Copy your Client ID and Client Secret**

## **🔧 Step 2: Update Environment Variables**

### **2.1 Add to your .env file:**
```env
# Google OAuth (for social login)
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
```

### **2.2 Fix Email Configuration:**
```env
# Email Configuration (for password reset)
EMAIL_USER=kamalswarnkar284@gmail.com
EMAIL_PASS=your_16_character_app_password  # NOT your regular password
FROM_NAME=TaleOn
FROM_EMAIL=kamalswarnkar284@gmail.com
```

## **📧 Step 3: Fix Email Issues**

### **3.1 Generate Gmail App Password:**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. **Security** → **2-Step Verification** → **App passwords**
3. Select **"Mail"** → **"Other (Custom name)"**
4. Name: `TaleOn`
5. **Copy the 16-character password**

### **3.2 Test Email Configuration:**
```bash
# Test endpoint
GET http://localhost:5000/auth/test-email
```

## **🧪 Step 4: Test Everything**

### **4.1 Test Email:**
```bash
curl http://localhost:5000/auth/test-email
```

### **4.2 Test Google OAuth:**
1. Visit: `http://localhost:5000/auth/google`
2. Should redirect to Google login
3. After login, redirects back to frontend

### **4.3 Test Password Reset:**
1. Go to forgot password page
2. Enter any email
3. Check if reset email is sent

## **🔍 Troubleshooting**

### **Email Not Working:**
- ✅ Use Gmail App Password (16 characters)
- ✅ Enable 2-Factor Authentication
- ✅ Check backend logs for `[EMAIL]` messages
- ✅ Test with `/auth/test-email` endpoint

### **Google OAuth Not Working:**
- ✅ Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- ✅ Verify redirect URIs in Google Console
- ✅ Check backend logs for passport errors
- ✅ Ensure Google+ API is enabled

### **Common Error Messages:**
```
[EMAIL] Email configuration missing → Check .env file
[EMAIL] Failed to create transporter → Check App Password
[EMAIL] Failed to send email → Check Gmail settings
```

## **📱 Frontend Integration**

### **Add Google Login Button:**
```jsx
// In your Login/Signup components
<a 
  href="http://localhost:5000/auth/google"
  className="google-login-btn"
>
  Continue with Google
</a>
```

### **Handle OAuth Callback:**
```jsx
// Create /auth-success route to handle Google OAuth callback
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const user = JSON.parse(decodeURIComponent(urlParams.get('user')));
  
  if (token && user) {
    // Store user data and token
    sessionStorage.setItem('user', JSON.stringify({ ...user, token }));
    navigate('/'); // Redirect to home
  }
}, []);
```

## **✅ Final Checklist**

- [ ] Google Cloud Project created
- [ ] Google+ API enabled
- [ ] OAuth 2.0 credentials created
- [ ] Redirect URIs configured
- [ ] Environment variables updated
- [ ] Gmail App Password generated
- [ ] Email configuration tested
- [ ] Google OAuth tested
- [ ] Frontend integration added

## **🚨 Security Notes**

- **Never commit** `.env` files to git
- **Keep** OAuth credentials secure
- **Use** HTTPS in production
- **Validate** all OAuth data
- **Implement** proper session management

---

**🎮 Happy OAuth-ing!** Your users can now sign in with Google! 🚀

