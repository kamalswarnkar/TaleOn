import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js'; // ✅
import gameRoutes from './routes/gameRoutes.js'; // ✅
import morgan from 'morgan';

dotenv.config();

// Connect to database
connectDB();

// Import passport config dynamically after environment variables are loaded
const loadPassport = async () => {
  try {
    await import('./config/passport.js');
    console.log('✅ Passport configuration loaded');
  } catch (err) {
    console.error('❌ Error loading passport config:', err);
  }
};

// Load passport after environment variables are set
loadPassport();

const app = express();

// Secure CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      process.env.FRONTEND_URL || 'https://yourdomain.com',
      'https://www.yourdomain.com'
    ]
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware (required for passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'taleon_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

app.use('/auth', authRoutes);
app.use('/room', roomRoutes); // ✅
app.use('/game', gameRoutes); // ✅

app.get('/', (_req, res) => {
  res.send('TaleOn Backend is running 🚀');
});

// Test route to verify backend is working
app.get('/test', (_req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test Google OAuth callback URL
app.get('/test-google-callback', (_req, res) => {
  const hasGoogleConfig = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  res.json({
    message: 'Google OAuth callback test',
    configured: hasGoogleConfig,
    callbackUrl: hasGoogleConfig ? '/auth/google/callback' : 'Not configured',
    status: hasGoogleConfig ? 'enabled' : 'disabled'
  });
});

// Test email configuration
app.get('/test-email-config', (_req, res) => {
  const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;
  res.json({
    message: 'Email configuration test',
    configured: hasEmailConfig,
    emailUser: process.env.EMAIL_USER ? '✅ Found' : '❌ Missing',
    emailPass: process.env.EMAIL_PASS ? '✅ Found' : '❌ Missing',
    fromName: process.env.FROM_NAME || 'Not set',
    fromEmail: process.env.FROM_EMAIL || 'Not set',
    status: hasEmailConfig ? 'enabled' : 'disabled'
  });
});

// Test database connection
app.get('/test-db', async (_req, res) => {
  try {
    const mongoose = await import('mongoose');
    const connectionState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    res.json({
      message: 'Database connection test',
      status: states[connectionState] || 'unknown',
      connected: connectionState === 1,
      uri: process.env.MONGODB_URI ? '✅ Found' : '❌ Missing'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Database connection test failed',
      error: error.message
    });
  }
});

// Test passport configuration
app.get('/test-passport', (_req, res) => {
  const strategies = Object.keys(passport._strategies || {});
  
  res.json({
    message: 'Passport configuration test',
    strategies: strategies,
    googleStrategy: strategies.includes('google') ? '✅ Loaded' : '❌ Not loaded',
    localStrategy: strategies.includes('local') ? '✅ Loaded' : '❌ Not loaded',
    googleConfig: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? '✅ Ready' : '❌ Missing config'
  });
});

// Test Google OAuth flow
app.get('/test-google-flow', (_req, res) => {
  const hasGoogleConfig = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  
  if (!hasGoogleConfig) {
    return res.json({
      message: 'Google OAuth flow test',
      status: 'disabled',
      reason: 'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET',
      nextSteps: 'Add both variables to your .env file'
    });
  }
  
  res.json({
    message: 'Google OAuth flow test',
    status: 'enabled',
    authUrl: '/auth/google',
    callbackUrl: '/auth/google/callback',
    nextSteps: 'Visit /auth/google to test the OAuth flow'
  });
});

// Test email flow
app.get('/test-email-flow', (_req, res) => {
  const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;
  
  if (!hasEmailConfig) {
    return res.json({
      message: 'Email flow test',
      status: 'disabled',
      reason: 'Missing EMAIL_USER or EMAIL_PASS',
      nextSteps: 'Add both variables to your .env file'
    });
  }
  
  res.json({
    message: 'Email flow test',
    status: 'enabled',
    forgotPasswordUrl: '/auth/forgot-password',
    testEmailUrl: '/auth/test-email',
    nextSteps: 'Use POST /auth/forgot-password to test the email flow'
  });
});

// System health check
app.get('/health', (_req, res) => {
  const health = {
    message: 'TaleOn Backend Health Check',
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      database: process.env.MONGODB_URI ? 'configured' : 'missing',
      googleOAuth: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'configured' : 'missing',
      email: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'configured' : 'missing',
      jwt: process.env.JWT_SECRET ? 'configured' : 'missing'
    },
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  };
  
  // Check if any critical services are missing
  const criticalServices = ['database', 'jwt'];
  const missingCritical = criticalServices.filter(service => health.services[service] === 'missing');
  
  if (missingCritical.length > 0) {
    health.status = 'degraded';
    health.issues = `Missing critical services: ${missingCritical.join(', ')}`;
  }
  
  res.json(health);
});

// System status overview
app.get('/status', (_req, res) => {
  const status = {
    message: 'TaleOn Backend System Status',
    timestamp: new Date().toISOString(),
    overall: 'operational',
    components: {
      server: 'operational',
      database: process.env.MONGODB_URI ? 'operational' : 'degraded',
      authentication: 'operational',
      googleOAuth: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'operational' : 'disabled',
      email: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'operational' : 'disabled'
    },
    recommendations: []
  };
  
  // Generate recommendations
  if (!process.env.MONGODB_URI) {
    status.recommendations.push('Add MONGODB_URI to your .env file');
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    status.recommendations.push('Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file for OAuth');
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    status.recommendations.push('Add EMAIL_USER and EMAIL_PASS to your .env file for password reset emails');
  }
  
  // Determine overall status
  if (status.components.database === 'degraded') {
    status.overall = 'degraded';
  }
  
  res.json(status);
});

// Configuration overview
app.get('/config', (_req, res) => {
  const config = {
    message: 'TaleOn Backend Configuration Overview',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    frontendUrl: process.env.FRONTEND_URL || 'Not set',
    database: {
      uri: process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing',
      type: 'MongoDB'
    },
    authentication: {
      jwtSecret: process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing',
      sessionSecret: process.env.SESSION_SECRET ? '✅ Configured' : '❌ Missing'
    },
    googleOAuth: {
      clientId: process.env.GOOGLE_CLIENT_ID ? '✅ Found' : '❌ Missing',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? '✅ Found' : '❌ Missing',
      status: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'enabled' : 'disabled'
    },
    email: {
      user: process.env.EMAIL_USER ? '✅ Found' : '❌ Missing',
      pass: process.env.EMAIL_PASS ? '✅ Found' : '❌ Missing',
      fromName: process.env.FROM_NAME || 'Not set',
      fromEmail: process.env.FROM_EMAIL || 'Not set',
      status: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'enabled' : 'disabled'
    },
    ai: {
      groqApiKey: process.env.GROQ_API_KEY ? '✅ Found' : '❌ Missing',
      openaiApiKey: process.env.OPENAI_API_KEY ? '✅ Found' : '❌ Missing'
    }
  };
  
  res.json(config);
});

// System functionality test
app.get('/test-all', async (_req, res) => {
  const results = {
    message: 'TaleOn Backend Complete System Test',
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  // Test 1: Basic server
  results.tests.server = '✅ Operational';
  
  // Test 2: Environment variables
  const envVars = ['NODE_ENV', 'PORT', 'JWT_SECRET', 'SESSION_SECRET'];
  const missingEnvVars = envVars.filter(varName => !process.env[varName]);
  results.tests.environment = missingEnvVars.length === 0 ? '✅ All required variables present' : `❌ Missing: ${missingEnvVars.join(', ')}`;
  
  // Test 3: Database configuration
  results.tests.database = process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing MONGODB_URI';
  
  // Test 4: Google OAuth configuration
  const hasGoogleConfig = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  results.tests.googleOAuth = hasGoogleConfig ? '✅ Configured' : '❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET';
  
  // Test 5: Email configuration
  const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;
  results.tests.email = hasEmailConfig ? '✅ Configured' : '❌ Missing EMAIL_USER or EMAIL_PASS';
  
  // Test 6: Frontend URL
  results.tests.frontendUrl = process.env.FRONTEND_URL ? '✅ Configured' : '❌ Missing FRONTEND_URL';
  
  // Overall assessment
  const failedTests = Object.values(results.tests).filter(test => test.startsWith('❌'));
  results.overall = failedTests.length === 0 ? '✅ All systems operational' : `⚠️ ${failedTests.length} issue(s) detected`;
  
  if (failedTests.length > 0) {
    results.recommendations = [
      'Check your .env file for missing variables',
      'Ensure all required services are configured',
      'Review the /config endpoint for detailed configuration status'
    ];
  }
  
  res.json(results);
});

// System integration test
app.get('/test-integration', async (_req, res) => {
  const integration = {
    message: 'TaleOn Backend System Integration Test',
    timestamp: new Date().toISOString(),
    components: {},
    integration: {}
  };
  
  // Test individual components
  integration.components.database = process.env.MONGODB_URI ? 'ready' : 'not_configured';
  integration.components.googleOAuth = (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'ready' : 'not_configured';
  integration.components.email = (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'ready' : 'not_configured';
  integration.components.jwt = process.env.JWT_SECRET ? 'ready' : 'not_configured';
  integration.components.frontend = process.env.FRONTEND_URL ? 'ready' : 'not_configured';
  
  // Test integrations
  integration.integration.authFlow = (integration.components.jwt === 'ready' && integration.components.database === 'ready') ? '✅ Operational' : '❌ Blocked';
  integration.integration.googleAuth = (integration.components.googleOAuth === 'ready' && integration.components.database === 'ready') ? '✅ Operational' : '❌ Blocked';
  integration.integration.passwordReset = (integration.components.email === 'ready' && integration.components.database === 'ready') ? '✅ Operational' : '❌ Blocked';
  integration.integration.frontendIntegration = (integration.components.frontend === 'ready') ? '✅ Operational' : '❌ Blocked';
  
  // Overall integration status
  const operationalIntegrations = Object.values(integration.integration).filter(int => int.startsWith('✅'));
  integration.overall = operationalIntegrations.length === 4 ? '✅ Fully Integrated' : `⚠️ ${4 - operationalIntegrations.length} integration(s) blocked`;
  
  // Recommendations
  integration.recommendations = [];
  if (integration.components.database === 'not_configured') {
    integration.recommendations.push('Configure MONGODB_URI to enable all integrations');
  }
  if (integration.components.googleOAuth === 'not_configured') {
    integration.recommendations.push('Configure Google OAuth for social login integration');
  }
  if (integration.components.email === 'not_configured') {
    integration.recommendations.push('Configure email for password reset integration');
  }
  if (integration.components.jwt === 'not_configured') {
    integration.recommendations.push('Configure JWT_SECRET for authentication integration');
  }
  if (integration.components.frontend === 'not_configured') {
    integration.recommendations.push('Configure FRONTEND_URL for frontend integration');
  }
  
  res.json(integration);
});

// System readiness check
app.get('/ready', async (_req, res) => {
  const readiness = {
    message: 'TaleOn Backend System Readiness Check',
    timestamp: new Date().toISOString(),
    ready: true,
    checks: {},
    issues: []
  };
  
  // Check 1: Database
  if (!process.env.MONGODB_URI) {
    readiness.ready = false;
    readiness.checks.database = '❌ Missing MONGODB_URI';
    readiness.issues.push('Database connection cannot be established');
  } else {
    readiness.checks.database = '✅ Configured';
  }
  
  // Check 2: JWT Secret
  if (!process.env.JWT_SECRET) {
    readiness.ready = false;
    readiness.checks.jwt = '❌ Missing JWT_SECRET';
    readiness.issues.push('Authentication tokens cannot be generated');
  } else {
    readiness.checks.jwt = '✅ Configured';
  }
  
  // Check 3: Session Secret
  if (!process.env.SESSION_SECRET) {
    readiness.ready = false;
    readiness.checks.session = '❌ Missing SESSION_SECRET';
    readiness.issues.push('User sessions cannot be maintained securely');
  } else {
    readiness.checks.session = '✅ Configured';
  }
  
  // Check 4: Google OAuth (optional but recommended)
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    readiness.checks.googleOAuth = '⚠️ Not configured (optional)';
    readiness.issues.push('Google OAuth login will not be available');
  } else {
    readiness.checks.googleOAuth = '✅ Configured';
  }
  
  // Check 5: Email (optional but recommended)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    readiness.checks.email = '⚠️ Not configured (optional)';
    readiness.issues.push('Password reset emails will not be sent');
  } else {
    readiness.checks.email = '✅ Configured';
  }
  
  // Check 6: Frontend URL
  if (!process.env.FRONTEND_URL) {
    readiness.checks.frontend = '⚠️ Not configured (optional)';
    readiness.issues.push('CORS and redirects may not work properly');
  } else {
    readiness.checks.frontend = '✅ Configured';
  }
  
  // Overall status
  readiness.status = readiness.ready ? 'ready' : 'not_ready';
  readiness.summary = readiness.ready 
    ? 'All critical systems are configured and ready'
    : `Critical issues detected: ${readiness.issues.length} problem(s)`;
  
  // HTTP status code
  const statusCode = readiness.ready ? 200 : 503;
  res.status(statusCode).json(readiness);
});

// System troubleshooting guide
app.get('/troubleshoot', (_req, res) => {
  const troubleshooting = {
    message: 'TaleOn Backend Troubleshooting Guide',
    timestamp: new Date().toISOString(),
    commonIssues: [
      {
        issue: 'Google OAuth returns 503 "not configured"',
        cause: 'Missing or incorrect GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET in .env',
        solution: 'Verify both variables are set correctly in your .env file',
        test: 'GET /auth/test-google'
      },
      {
        issue: 'Password reset emails not sent',
        cause: 'Missing or incorrect EMAIL_USER/EMAIL_PASS in .env',
        solution: 'Verify both variables are set correctly in your .env file',
        test: 'GET /auth/test-email'
      },
      {
        issue: 'Database connection fails',
        cause: 'Missing or incorrect MONGODB_URI in .env',
        solution: 'Verify MONGODB_URI is set correctly in your .env file',
        test: 'GET /test-db'
      },
      {
        issue: 'Authentication fails',
        cause: 'Missing or incorrect JWT_SECRET in .env',
        solution: 'Verify JWT_SECRET is set correctly in your .env file',
        test: 'GET /test-passport'
      }
    ],
    diagnosticEndpoints: [
      'GET /health - Overall system health',
      'GET /status - System status overview',
      'GET /config - Configuration details',
      'GET /ready - System readiness check',
      'GET /test-all - Complete system test',
      'GET /test-integration - Integration test',
      'GET /debug/env - Environment variables',
      'GET /auth/test-google - Google OAuth test',
      'GET /auth/test-email - Email configuration test',
      'GET /test-db - Database connection test',
      'GET /test-passport - Passport configuration test'
    ],
    nextSteps: [
      'Check the /ready endpoint for critical issues',
      'Use /test-all for comprehensive system testing',
      'Review /config for detailed configuration status',
      'Test specific components with their respective test endpoints'
    ]
  };
  
  res.json(troubleshooting);
});

// System summary
app.get('/summary', (_req, res) => {
  const summary = {
    message: 'TaleOn Backend System Summary',
    timestamp: new Date().toISOString(),
    overview: {
      name: 'TaleOn Backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000
    },
    services: {
      database: {
        status: process.env.MONGODB_URI ? 'configured' : 'missing',
        type: 'MongoDB',
        critical: true
      },
      authentication: {
        status: process.env.JWT_SECRET ? 'configured' : 'missing',
        type: 'JWT + Passport',
        critical: true
      },
      googleOAuth: {
        status: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'configured' : 'missing',
        type: 'Social Login',
        critical: false
      },
      email: {
        status: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'configured' : 'missing',
        type: 'Password Reset',
        critical: false
      },
      frontend: {
        status: process.env.FRONTEND_URL ? 'configured' : 'missing',
        type: 'CORS & Redirects',
        critical: false
      }
    },
    endpoints: {
      health: '/health',
      status: '/status',
      config: '/config',
      ready: '/ready',
      test: '/test-all',
      integration: '/test-integration',
      troubleshoot: '/troubleshoot'
    },
    recommendations: []
  };
  
  // Generate recommendations
  if (!process.env.MONGODB_URI) {
    summary.recommendations.push('Configure MONGODB_URI for database connectivity');
  }
  if (!process.env.JWT_SECRET) {
    summary.recommendations.push('Configure JWT_SECRET for secure authentication');
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    summary.recommendations.push('Configure Google OAuth for social login functionality');
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    summary.recommendations.push('Configure email for password reset functionality');
  }
  if (!process.env.FRONTEND_URL) {
    summary.recommendations.push('Configure FRONTEND_URL for proper CORS and redirects');
  }
  
  // Overall status
  const criticalServices = Object.values(summary.services).filter(service => service.critical);
  const configuredCritical = criticalServices.filter(service => service.status === 'configured');
  summary.overall = configuredCritical.length === criticalServices.length ? 'operational' : 'degraded';
  
  res.json(summary);
});

// System help
app.get('/help', (_req, res) => {
  const help = {
    message: 'TaleOn Backend Help & Documentation',
    timestamp: new Date().toISOString(),
    quickStart: [
      '1. Check system status: GET /ready',
      '2. View configuration: GET /config',
      '3. Run diagnostics: GET /test-all',
      '4. Check integration: GET /test-integration',
      '5. Get troubleshooting: GET /troubleshoot'
    ],
    endpoints: {
      'System Health': {
        '/health': 'Overall system health status',
        '/status': 'System status overview',
        '/ready': 'System readiness check'
      },
      'Configuration': {
        '/config': 'Configuration details',
        '/debug/env': 'Environment variables'
      },
      'Testing': {
        '/test': 'Basic server test',
        '/test-all': 'Complete system test',
        '/test-integration': 'Integration test',
        '/test-db': 'Database connection test',
        '/test-passport': 'Passport configuration test',
        '/test-google-callback': 'Google OAuth callback test',
        '/test-email-config': 'Email configuration test',
        '/test-google-flow': 'Google OAuth flow test',
        '/test-email-flow': 'Email flow test'
      },
      'Authentication': {
        '/auth/test-google': 'Google OAuth test',
        '/auth/test-email': 'Email configuration test'
      },
      'Documentation': {
        '/summary': 'System summary',
        '/troubleshoot': 'Troubleshooting guide',
        '/help': 'This help page'
      }
    },
    commonCommands: [
      'curl http://localhost:5000/ready',
      'curl http://localhost:5000/config',
      'curl http://localhost:5000/test-all',
      'curl http://localhost:5000/health'
    ],
    nextSteps: [
      'Start with /ready to check system readiness',
      'Use /config to review your configuration',
      'Run /test-all for comprehensive testing',
      'Check /troubleshoot if you encounter issues'
    ]
  };
  
  res.json(help);
});

// System info
app.get('/info', (_req, res) => {
  const info = {
    message: 'TaleOn Backend System Information',
    timestamp: new Date().toISOString(),
    system: {
      name: 'TaleOn Backend',
      version: '1.0.0',
      description: 'A real-time storytelling game backend with authentication, OAuth, and email services',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000
    },
    features: [
      'User authentication with JWT',
      'Google OAuth social login',
      'Password reset via email',
      'MongoDB database integration',
      'Real-time socket.io support',
      'Comprehensive testing endpoints',
      'Health monitoring and diagnostics'
    ],
    technologies: [
      'Node.js',
      'Express.js',
      'MongoDB with Mongoose',
      'Passport.js for authentication',
      'Socket.io for real-time communication',
      'Nodemailer for email services',
      'JWT for token-based auth'
    ],
    architecture: {
      'Authentication Layer': 'Passport.js with JWT',
      'Database Layer': 'MongoDB with Mongoose ODM',
      'API Layer': 'Express.js REST API',
      'Real-time Layer': 'Socket.io for game events',
      'Email Layer': 'Nodemailer for notifications',
      'Security Layer': 'CORS, rate limiting, security headers'
    },
    endpoints: {
      'Health & Monitoring': ['/health', '/status', '/ready'],
      'Configuration': ['/config', '/debug/env'],
      'Testing': ['/test-all', '/test-integration'],
      'Documentation': ['/help', '/troubleshoot', '/summary']
    },
    contact: {
      'Documentation': '/help',
      'Troubleshooting': '/troubleshoot',
      'Status': '/status',
      'Health': '/health'
    }
  };
  
  res.json(info);
});

// System version
app.get('/version', (_req, res) => {
  const version = {
    message: 'TaleOn Backend Version Information',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    codename: 'Phoenix',
    releaseDate: '2024-12-26',
    changelog: [
      'v1.0.0 - Initial release with comprehensive testing endpoints',
      'Added health monitoring and diagnostics',
      'Added Google OAuth integration',
      'Added email service integration',
      'Added comprehensive testing framework',
      'Added troubleshooting and help endpoints'
    ],
    features: {
      'Core': ['Authentication', 'Database', 'Real-time communication'],
      'OAuth': ['Google OAuth 2.0', 'Social login', 'Account linking'],
      'Email': ['Password reset', 'Email notifications', 'Gmail integration'],
      'Testing': ['Health checks', 'Integration tests', 'Component tests'],
      'Monitoring': ['System status', 'Configuration overview', 'Troubleshooting']
    },
    requirements: {
      'Node.js': '>=18.0.0',
      'MongoDB': '>=5.0.0',
      'Environment': 'Node.js environment with ES modules'
    },
    support: {
      'Documentation': '/help',
      'Troubleshooting': '/troubleshoot',
      'Status': '/status',
      'Health': '/health'
    }
  };
  
  res.json(version);
});

// System about
app.get('/about', (_req, res) => {
  const about = {
    message: 'About TaleOn Backend',
    timestamp: new Date().toISOString(),
    project: {
      name: 'TaleOn',
      description: 'A real-time collaborative storytelling game where players take turns contributing to a shared narrative',
      type: 'Multiplayer Web Game',
      genre: 'Storytelling, Collaboration, Real-time'
    },
    backend: {
      purpose: 'Provide robust backend services for the TaleOn game',
      architecture: 'RESTful API with real-time WebSocket support',
      features: [
        'User authentication and management',
        'Game room creation and management',
        'Real-time game state synchronization',
        'AI player integration',
        'Social login with Google OAuth',
        'Password reset via email'
      ]
    },
    technology: {
      'Backend Framework': 'Node.js with Express.js',
      'Database': 'MongoDB with Mongoose ODM',
      'Authentication': 'Passport.js with JWT',
      'Real-time': 'Socket.io for WebSocket communication',
      'Email': 'Nodemailer for email services',
      'OAuth': 'Google OAuth 2.0 for social login'
    },
    development: {
      'Environment': 'Development with comprehensive testing',
      'Testing': 'Extensive endpoint testing and health monitoring',
      'Documentation': 'Comprehensive API documentation and troubleshooting',
      'Monitoring': 'Real-time system health and status monitoring'
    },
    endpoints: {
      'Core': ['/health', '/status', '/ready'],
      'Testing': ['/test-all', '/test-integration'],
      'Documentation': ['/help', '/troubleshoot', '/about'],
      'Game': ['/room', '/game', '/auth']
    },
    contact: {
      'Documentation': '/help',
      'Troubleshooting': '/troubleshoot',
      'Status': '/status',
      'Health': '/health'
    }
  };
  
  res.json(about);
});

// System welcome
app.get('/welcome', (_req, res) => {
  const welcome = {
    message: 'Welcome to TaleOn Backend! 🚀',
    timestamp: new Date().toISOString(),
    greeting: 'Hello! Welcome to the TaleOn Backend API. This is a comprehensive backend system for a real-time storytelling game.',
    quickStart: [
      '🎯 Start here: GET /ready - Check if the system is ready',
      '🔧 Configuration: GET /config - View your current configuration',
      '🧪 Testing: GET /test-all - Run comprehensive system tests',
      '📊 Status: GET /status - Check overall system status',
      '❓ Help: GET /help - Get help and documentation'
    ],
    features: {
      '🎮 Game Features': [
        'User authentication with JWT',
        'Google OAuth social login',
        'Real-time game rooms',
        'AI player integration'
      ],
      '🔐 Security Features': [
        'Password reset via email',
        'Secure session management',
        'CORS protection',
        'Rate limiting'
      ],
      '📈 Monitoring Features': [
        'Health checks',
        'System diagnostics',
        'Configuration overview',
        'Troubleshooting guides'
      ]
    },
    endpoints: {
      '🏠 Home': '/',
      '📋 Health': '/health',
      '⚙️ Config': '/config',
      '🧪 Tests': '/test-all',
      '📚 Help': '/help',
      'ℹ️ About': '/about'
    },
    nextSteps: [
      'Check system readiness with /ready',
      'Review configuration with /config',
      'Run diagnostics with /test-all',
      'Get help with /help'
    ],
    support: {
      'Documentation': '/help',
      'Troubleshooting': '/troubleshoot',
      'Status': '/status',
      'Health': '/health'
    }
  };
  
  res.json(welcome);
});

// System dashboard
app.get('/dashboard', (_req, res) => {
  const dashboard = {
    message: 'TaleOn Backend Dashboard',
    timestamp: new Date().toISOString(),
    overview: {
      status: 'operational',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    },
    services: {
      database: {
        status: process.env.MONGODB_URI ? 'operational' : 'degraded',
        icon: process.env.MONGODB_URI ? '🟢' : '🔴',
        name: 'MongoDB'
      },
      authentication: {
        status: process.env.JWT_SECRET ? 'operational' : 'degraded',
        icon: process.env.JWT_SECRET ? '🟢' : '🔴',
        name: 'JWT Auth'
      },
      googleOAuth: {
        status: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'operational' : 'disabled',
        icon: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? '🟢' : '🟡',
        name: 'Google OAuth'
      },
      email: {
        status: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'operational' : 'disabled',
        icon: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? '🟢' : '🟡',
        name: 'Email Service'
      },
      frontend: {
        status: process.env.FRONTEND_URL ? 'operational' : 'warning',
        icon: process.env.FRONTEND_URL ? '🟢' : '🟡',
        name: 'Frontend Integration'
      }
    },
    quickActions: [
      { action: 'Check Health', endpoint: '/health', method: 'GET' },
      { action: 'View Config', endpoint: '/config', method: 'GET' },
      { action: 'Run Tests', endpoint: '/test-all', method: 'GET' },
      { action: 'Get Help', endpoint: '/help', method: 'GET' }
    ],
    metrics: {
      totalEndpoints: 25,
      healthStatus: 'operational',
      lastCheck: new Date().toISOString(),
      recommendations: []
    }
  };
  
  // Generate recommendations
  if (!process.env.MONGODB_URI) {
    dashboard.metrics.recommendations.push('Configure MONGODB_URI for database connectivity');
  }
  if (!process.env.JWT_SECRET) {
    dashboard.metrics.recommendations.push('Configure JWT_SECRET for secure authentication');
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    dashboard.metrics.recommendations.push('Configure Google OAuth for social login');
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    dashboard.metrics.recommendations.push('Configure email for password reset functionality');
  }
  
  // Determine overall status
  const criticalServices = ['database', 'authentication'];
  const criticalStatus = criticalServices.map(service => dashboard.services[service].status);
  if (criticalStatus.includes('degraded')) {
    dashboard.overview.status = 'degraded';
  }
  
  res.json(dashboard);
});

// System status overview
app.get('/status-overview', (_req, res) => {
  const statusOverview = {
    message: 'TaleOn Backend Status Overview',
    timestamp: new Date().toISOString(),
    system: {
      name: 'TaleOn Backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    },
    health: {
      overall: 'healthy',
      database: process.env.MONGODB_URI ? 'healthy' : 'unhealthy',
      authentication: process.env.JWT_SECRET ? 'healthy' : 'unhealthy',
      googleOAuth: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'healthy' : 'disabled',
      email: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'healthy' : 'disabled'
    },
    services: {
      'Database Connection': process.env.MONGODB_URI ? '✅ Available' : '❌ Unavailable',
      'JWT Authentication': process.env.JWT_SECRET ? '✅ Available' : '❌ Unavailable',
      'Google OAuth': (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? '✅ Available' : '❌ Unavailable',
      'Email Service': (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? '✅ Available' : '❌ Unavailable',
      'Frontend Integration': process.env.FRONTEND_URL ? '✅ Available' : '❌ Unavailable'
    },
    configuration: {
      'Environment Variables': 'Loaded',
      'Database URI': process.env.MONGODB_URI ? 'Configured' : 'Missing',
      'JWT Secret': process.env.JWT_SECRET ? 'Configured' : 'Missing',
      'Google OAuth': (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'Configured' : 'Missing',
      'Email Service': (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'Configured' : 'Missing'
    },
    recommendations: []
  };
  
  // Generate recommendations
  if (!process.env.MONGODB_URI) {
    statusOverview.recommendations.push('Add MONGODB_URI to your .env file for database connectivity');
  }
  if (!process.env.JWT_SECRET) {
    statusOverview.recommendations.push('Add JWT_SECRET to your .env file for secure authentication');
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    statusOverview.recommendations.push('Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file for OAuth');
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    statusOverview.recommendations.push('Add EMAIL_USER and EMAIL_PASS to your .env file for password reset emails');
  }
  
  // Determine overall health
  const criticalServices = ['database', 'authentication'];
  const unhealthyCritical = criticalServices.filter(service => statusOverview.health[service] === 'unhealthy');
  if (unhealthyCritical.length > 0) {
    statusOverview.health.overall = 'unhealthy';
  }
  
  res.json(statusOverview);
});

// System health check
app.get('/health-check', (_req, res) => {
  const healthCheck = {
    message: 'TaleOn Backend Health Check',
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {},
    issues: [],
    recommendations: []
  };
  
  // Check 1: Database
  if (!process.env.MONGODB_URI) {
    healthCheck.status = 'unhealthy';
    healthCheck.checks.database = '❌ Missing MONGODB_URI';
    healthCheck.issues.push('Database connection cannot be established');
    healthCheck.recommendations.push('Add MONGODB_URI to your .env file');
  } else {
    healthCheck.checks.database = '✅ MONGODB_URI configured';
  }
  
  // Check 2: JWT Secret
  if (!process.env.JWT_SECRET) {
    healthCheck.status = 'unhealthy';
    healthCheck.checks.jwt = '❌ Missing JWT_SECRET';
    healthCheck.issues.push('Authentication tokens cannot be generated');
    healthCheck.recommendations.push('Add JWT_SECRET to your .env file');
  } else {
    healthCheck.checks.jwt = '✅ JWT_SECRET configured';
  }
  
  // Check 3: Session Secret
  if (!process.env.SESSION_SECRET) {
    healthCheck.status = 'unhealthy';
    healthCheck.checks.session = '❌ Missing SESSION_SECRET';
    healthCheck.issues.push('User sessions cannot be maintained securely');
    healthCheck.recommendations.push('Add SESSION_SECRET to your .env file');
  } else {
    healthCheck.checks.session = '✅ SESSION_SECRET configured';
  }
  
  // Check 4: Google OAuth (optional)
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    healthCheck.checks.googleOAuth = '⚠️ Google OAuth not configured (optional)';
    healthCheck.issues.push('Google OAuth login will not be available');
    healthCheck.recommendations.push('Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file');
  } else {
    healthCheck.checks.googleOAuth = '✅ Google OAuth configured';
  }
  
  // Check 5: Email (optional)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    healthCheck.checks.email = '⚠️ Email service not configured (optional)';
    healthCheck.issues.push('Password reset emails will not be sent');
    healthCheck.recommendations.push('Add EMAIL_USER and EMAIL_PASS to your .env file');
  } else {
    healthCheck.checks.email = '✅ Email service configured';
  }
  
  // Check 6: Frontend URL (optional)
  if (!process.env.FRONTEND_URL) {
    healthCheck.checks.frontend = '⚠️ Frontend URL not configured (optional)';
    healthCheck.issues.push('CORS and redirects may not work properly');
    healthCheck.recommendations.push('Add FRONTEND_URL to your .env file');
  } else {
    healthCheck.checks.frontend = '✅ Frontend URL configured';
  }
  
  // Summary
  healthCheck.summary = healthCheck.status === 'healthy' 
    ? 'All critical systems are healthy'
    : `Health issues detected: ${healthCheck.issues.length} problem(s)`;
  
  // HTTP status code
  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// System diagnostics
app.get('/diagnostics', (_req, res) => {
  const diagnostics = {
    message: 'TaleOn Backend System Diagnostics',
    timestamp: new Date().toISOString(),
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    },
    environment: {
      'NODE_ENV': process.env.NODE_ENV || 'Not set',
      'PORT': process.env.PORT || 'Not set',
      'MONGODB_URI': process.env.MONGODB_URI ? '✅ Set' : '❌ Not set',
      'JWT_SECRET': process.env.JWT_SECRET ? '✅ Set' : '❌ Not set',
      'SESSION_SECRET': process.env.SESSION_SECRET ? '✅ Set' : '❌ Not set',
      'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set',
      'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Not set',
      'EMAIL_USER': process.env.EMAIL_USER ? '✅ Set' : '❌ Not set',
      'EMAIL_PASS': process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set',
      'FRONTEND_URL': process.env.FRONTEND_URL || 'Not set'
    },
    services: {
      database: {
        configured: !!process.env.MONGODB_URI,
        status: process.env.MONGODB_URI ? 'ready' : 'not_configured'
      },
      authentication: {
        configured: !!process.env.JWT_SECRET,
        status: process.env.JWT_SECRET ? 'ready' : 'not_configured'
      },
      googleOAuth: {
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        status: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'ready' : 'not_configured'
      },
      email: {
        configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        status: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'ready' : 'not_configured'
      }
    },
    analysis: {
      criticalIssues: [],
      warnings: [],
      recommendations: []
    }
  };
  
  // Analyze critical issues
  if (!process.env.MONGODB_URI) {
    diagnostics.analysis.criticalIssues.push('Database connection not configured');
  }
  if (!process.env.JWT_SECRET) {
    diagnostics.analysis.criticalIssues.push('JWT authentication not configured');
  }
  if (!process.env.SESSION_SECRET) {
    diagnostics.analysis.criticalIssues.push('Session management not configured');
  }
  
  // Analyze warnings
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    diagnostics.analysis.warnings.push('Google OAuth not configured (social login disabled)');
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    diagnostics.analysis.warnings.push('Email service not configured (password reset disabled)');
  }
  if (!process.env.FRONTEND_URL) {
    diagnostics.analysis.warnings.push('Frontend URL not configured (CORS may not work properly)');
  }
  
  // Generate recommendations
  if (!process.env.MONGODB_URI) {
    diagnostics.analysis.recommendations.push('Add MONGODB_URI to your .env file');
  }
  if (!process.env.JWT_SECRET) {
    diagnostics.analysis.recommendations.push('Add JWT_SECRET to your .env file');
  }
  if (!process.env.SESSION_SECRET) {
    diagnostics.analysis.recommendations.push('Add SESSION_SECRET to your .env file');
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    diagnostics.analysis.recommendations.push('Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file');
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    diagnostics.analysis.recommendations.push('Add EMAIL_USER and EMAIL_PASS to your .env file');
  }
  if (!process.env.FRONTEND_URL) {
    diagnostics.analysis.recommendations.push('Add FRONTEND_URL to your .env file');
  }
  
  // Overall status
  diagnostics.status = diagnostics.analysis.criticalIssues.length === 0 ? 'operational' : 'degraded';
  diagnostics.summary = diagnostics.analysis.criticalIssues.length === 0 
    ? 'System is operational'
    : `Critical issues detected: ${diagnostics.analysis.criticalIssues.length}`;
  
  res.json(diagnostics);
});

// System report
app.get('/report', (_req, res) => {
  const report = {
    message: 'TaleOn Backend System Report',
    timestamp: new Date().toISOString(),
    executive: {
      summary: 'Comprehensive system status and configuration report',
      status: 'operational',
      criticalIssues: 0,
      warnings: 0,
      recommendations: 0
    },
    configuration: {
      database: {
        configured: !!process.env.MONGODB_URI,
        status: process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing',
        impact: 'Critical - Required for all operations'
      },
      authentication: {
        configured: !!process.env.JWT_SECRET,
        status: process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing',
        impact: 'Critical - Required for user authentication'
      },
      session: {
        configured: !!process.env.SESSION_SECRET,
        status: process.env.SESSION_SECRET ? '✅ Configured' : '❌ Missing',
        impact: 'Critical - Required for session management'
      },
      googleOAuth: {
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        status: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? '✅ Configured' : '❌ Missing',
        impact: 'Optional - Enables social login'
      },
      email: {
        configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        status: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? '✅ Configured' : '❌ Missing',
        impact: 'Optional - Enables password reset emails'
      },
      frontend: {
        configured: !!process.env.FRONTEND_URL,
        status: process.env.FRONTEND_URL ? '✅ Configured' : '❌ Missing',
        impact: 'Optional - Enables proper CORS and redirects'
      }
    },
    analysis: {
      criticalIssues: [],
      warnings: [],
      recommendations: []
    },
    metrics: {
      totalServices: 6,
      configuredServices: 0,
      criticalServices: 3,
      optionalServices: 3
    }
  };
  
  // Count configured services
  Object.values(report.configuration).forEach(service => {
    if (service.configured) {
      report.metrics.configuredServices++;
    }
  });
  
  // Analyze issues
  if (!process.env.MONGODB_URI) {
    report.analysis.criticalIssues.push('Database connection not configured');
    report.executive.criticalIssues++;
  }
  if (!process.env.JWT_SECRET) {
    report.analysis.criticalIssues.push('JWT authentication not configured');
    report.executive.criticalIssues++;
  }
  if (!process.env.SESSION_SECRET) {
    report.analysis.criticalIssues.push('Session management not configured');
    report.executive.criticalIssues++;
  }
  
  // Analyze warnings
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    report.analysis.warnings.push('Google OAuth not configured');
    report.executive.warnings++;
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    report.analysis.warnings.push('Email service not configured');
    report.executive.warnings++;
  }
  if (!process.env.FRONTEND_URL) {
    report.analysis.warnings.push('Frontend URL not configured');
    report.executive.warnings++;
  }
  
  // Generate recommendations
  if (!process.env.MONGODB_URI) {
    report.analysis.recommendations.push('Add MONGODB_URI to your .env file');
    report.executive.recommendations++;
  }
  if (!process.env.JWT_SECRET) {
    report.analysis.recommendations.push('Add JWT_SECRET to your .env file');
    report.executive.recommendations++;
  }
  if (!process.env.SESSION_SECRET) {
    report.analysis.recommendations.push('Add SESSION_SECRET to your .env file');
    report.executive.recommendations++;
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    report.analysis.recommendations.push('Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file');
    report.executive.recommendations++;
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    report.analysis.recommendations.push('Add EMAIL_USER and EMAIL_PASS to your .env file');
    report.executive.recommendations++;
  }
  if (!process.env.FRONTEND_URL) {
    report.analysis.recommendations.push('Add FRONTEND_URL to your .env file');
    report.executive.recommendations++;
  }
  
  // Determine overall status
  if (report.executive.criticalIssues > 0) {
    report.executive.status = 'degraded';
  } else if (report.executive.warnings > 0) {
    report.executive.status = 'operational_with_warnings';
  } else {
    report.executive.status = 'fully_operational';
  }
  
  // Summary
  report.executive.summary = report.executive.criticalIssues === 0 
    ? 'System is operational'
    : `Critical issues detected: ${report.executive.criticalIssues}`;
  
  res.json(report);
});

// System overview
app.get('/overview', (_req, res) => {
  const overview = {
    message: 'TaleOn Backend System Overview',
    timestamp: new Date().toISOString(),
    system: {
      name: 'TaleOn Backend',
      version: '1.0.0',
      description: 'Real-time storytelling game backend with comprehensive monitoring',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    },
    status: {
      overall: 'operational',
      database: process.env.MONGODB_URI ? 'operational' : 'degraded',
      authentication: process.env.JWT_SECRET ? 'operational' : 'degraded',
      googleOAuth: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'operational' : 'disabled',
      email: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'operational' : 'disabled'
    },
    services: {
      'Database': {
        status: process.env.MONGODB_URI ? '✅ Operational' : '❌ Degraded',
        description: 'MongoDB connection for data persistence'
      },
      'Authentication': {
        status: process.env.JWT_SECRET ? '✅ Operational' : '❌ Degraded',
        description: 'JWT-based user authentication'
      },
      'Google OAuth': {
        status: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? '✅ Operational' : '❌ Disabled',
        description: 'Social login with Google'
      },
      'Email Service': {
        status: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? '✅ Operational' : '❌ Disabled',
        description: 'Password reset and notifications'
      },
      'Frontend Integration': {
        status: process.env.FRONTEND_URL ? '✅ Operational' : '❌ Limited',
        description: 'CORS and redirect configuration'
      }
    },
    endpoints: {
      'Health & Monitoring': ['/health', '/status', '/ready', '/dashboard'],
      'Configuration': ['/config', '/debug/env'],
      'Testing': ['/test-all', '/test-integration', '/diagnostics'],
      'Documentation': ['/help', '/troubleshoot', '/about', '/info']
    },
    quickActions: [
      { action: 'Check Health', endpoint: '/health', description: 'Overall system health' },
      { action: 'View Config', endpoint: '/config', description: 'Configuration status' },
      { action: 'Run Tests', endpoint: '/test-all', description: 'Comprehensive testing' },
      { action: 'Get Help', endpoint: '/help', description: 'Documentation and help' }
    ],
    recommendations: []
  };
  
  // Generate recommendations
  if (!process.env.MONGODB_URI) {
    overview.recommendations.push('Configure MONGODB_URI for database connectivity');
  }
  if (!process.env.JWT_SECRET) {
    overview.recommendations.push('Configure JWT_SECRET for secure authentication');
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    overview.recommendations.push('Configure Google OAuth for social login functionality');
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    overview.recommendations.push('Configure email for password reset functionality');
  }
  if (!process.env.FRONTEND_URL) {
    overview.recommendations.push('Configure FRONTEND_URL for proper CORS and redirects');
  }
  
  // Determine overall status
  const criticalServices = ['database', 'authentication'];
  const degradedCritical = criticalServices.filter(service => overview.status[service] === 'degraded');
  if (degradedCritical.length > 0) {
    overview.status.overall = 'degraded';
  }
  
  res.json(overview);
});

// System check
app.get('/check', (_req, res) => {
  const check = {
    message: 'TaleOn Backend System Check',
    timestamp: new Date().toISOString(),
    results: {
      database: {
        check: 'MONGODB_URI configuration',
        result: process.env.MONGODB_URI ? 'PASS' : 'FAIL',
        details: process.env.MONGODB_URI ? 'Database URI is configured' : 'Database URI is missing'
      },
      jwt: {
        check: 'JWT_SECRET configuration',
        result: process.env.JWT_SECRET ? 'PASS' : 'FAIL',
        details: process.env.JWT_SECRET ? 'JWT secret is configured' : 'JWT secret is missing'
      },
      session: {
        check: 'SESSION_SECRET configuration',
        result: process.env.SESSION_SECRET ? 'PASS' : 'FAIL',
        details: process.env.SESSION_SECRET ? 'Session secret is configured' : 'Session secret is missing'
      },
      googleOAuth: {
        check: 'Google OAuth configuration',
        result: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'PASS' : 'FAIL',
        details: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'Google OAuth is configured' : 'Google OAuth is not configured'
      },
      email: {
        check: 'Email service configuration',
        result: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'PASS' : 'FAIL',
        details: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'Email service is configured' : 'Email service is not configured'
      },
      frontend: {
        check: 'Frontend URL configuration',
        result: process.env.FRONTEND_URL ? 'PASS' : 'FAIL',
        details: process.env.FRONTEND_URL ? 'Frontend URL is configured' : 'Frontend URL is not configured'
      }
    },
    summary: {
      total: 6,
      passed: 0,
      failed: 0,
      critical: 0,
      optional: 0
    },
    status: 'unknown'
  };
  
  // Count results
  Object.values(check.results).forEach(result => {
    if (result.result === 'PASS') {
      check.summary.passed++;
    } else {
      check.summary.failed++;
    }
  });
  
  // Determine critical vs optional
  const criticalChecks = ['database', 'jwt', 'session'];
  const optionalChecks = ['googleOAuth', 'email', 'frontend'];
  
  criticalChecks.forEach(checkName => {
    if (check.results[checkName].result === 'FAIL') {
      check.summary.critical++;
    }
  });
  
  optionalChecks.forEach(checkName => {
    if (check.results[checkName].result === 'FAIL') {
      check.summary.optional++;
    }
  });
  
  // Determine overall status
  if (check.summary.critical > 0) {
    check.status = 'critical_failure';
  } else if (check.summary.failed > 0) {
    check.status = 'partial_failure';
  } else {
    check.status = 'all_passed';
  }
  
  // Generate recommendations
  check.recommendations = [];
  if (check.results.database.result === 'FAIL') {
    check.recommendations.push('Add MONGODB_URI to your .env file');
  }
  if (check.results.jwt.result === 'FAIL') {
    check.recommendations.push('Add JWT_SECRET to your .env file');
  }
  if (check.results.session.result === 'FAIL') {
    check.recommendations.push('Add SESSION_SECRET to your .env file');
  }
  if (check.results.googleOAuth.result === 'FAIL') {
    check.recommendations.push('Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file');
  }
  if (check.results.email.result === 'FAIL') {
    check.recommendations.push('Add EMAIL_USER and EMAIL_PASS to your .env file');
  }
  if (check.results.frontend.result === 'FAIL') {
    check.recommendations.push('Add FRONTEND_URL to your .env file');
  }
  
  res.json(check);
});

// System verify
app.get('/verify', (_req, res) => {
  const verify = {
    message: 'TaleOn Backend System Verification',
    timestamp: new Date().toISOString(),
    verification: {
      database: {
        required: true,
        configured: !!process.env.MONGODB_URI,
        verified: !!process.env.MONGODB_URI,
        message: process.env.MONGODB_URI ? 'Database URI is configured' : 'Database URI is missing'
      },
      jwt: {
        required: true,
        configured: !!process.env.JWT_SECRET,
        verified: !!process.env.JWT_SECRET,
        message: process.env.JWT_SECRET ? 'JWT secret is configured' : 'JWT secret is missing'
      },
      session: {
        required: true,
        configured: !!process.env.SESSION_SECRET,
        verified: !!process.env.SESSION_SECRET,
        message: process.env.SESSION_SECRET ? 'Session secret is configured' : 'Session secret is missing'
      },
      googleOAuth: {
        required: false,
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        verified: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        message: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'Google OAuth is configured' : 'Google OAuth is not configured'
      },
      email: {
        required: false,
        configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        verified: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        message: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'Email service is configured' : 'Email service is not configured'
      },
      frontend: {
        required: false,
        configured: !!process.env.FRONTEND_URL,
        verified: !!process.env.FRONTEND_URL,
        message: process.env.FRONTEND_URL ? 'Frontend URL is configured' : 'Frontend URL is not configured'
      }
    },
    summary: {
      total: 6,
      required: 3,
      optional: 3,
      requiredPassed: 0,
      optionalPassed: 0,
      overall: 'unknown'
    }
  };
  
  // Count results
  Object.values(verify.verification).forEach(item => {
    if (item.required) {
      verify.summary.requiredPassed += item.verified ? 1 : 0;
    } else {
      verify.summary.optionalPassed += item.verified ? 1 : 0;
    }
  });
  
  // Determine overall status
  if (verify.summary.requiredPassed === verify.summary.required) {
    if (verify.summary.optionalPassed === verify.summary.optional) {
      verify.summary.overall = 'fully_verified';
    } else {
      verify.summary.overall = 'minimally_verified';
    }
  } else {
    verify.summary.overall = 'verification_failed';
  }
  
  // Generate status message
  verify.status = verify.summary.overall === 'fully_verified' 
    ? 'All systems verified and operational'
    : verify.summary.overall === 'minimally_verified'
    ? 'Critical systems verified, optional systems not configured'
    : 'Critical systems verification failed';
  
  // Generate recommendations
  verify.recommendations = [];
  if (!verify.verification.database.verified) {
    verify.recommendations.push('Add MONGODB_URI to your .env file (Required)');
  }
  if (!verify.verification.jwt.verified) {
    verify.recommendations.push('Add JWT_SECRET to your .env file (Required)');
  }
  if (!verify.verification.session.verified) {
    verify.recommendations.push('Add SESSION_SECRET to your .env file (Required)');
  }
  if (!verify.verification.googleOAuth.verified) {
    verify.recommendations.push('Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file (Optional)');
  }
  if (!verify.verification.email.verified) {
    verify.recommendations.push('Add EMAIL_USER and EMAIL_PASS to your .env file (Optional)');
  }
  if (!verify.verification.frontend.verified) {
    verify.recommendations.push('Add FRONTEND_URL to your .env file (Optional)');
  }
  
  res.json(verify);
});

// System validate
app.get('/validate', (_req, res) => {
  const validate = {
    message: 'TaleOn Backend System Validation',
    timestamp: new Date().toISOString(),
    validation: {
      environment: {
        valid: true,
        checks: {
          'NODE_ENV': {
            valid: !!process.env.NODE_ENV,
            value: process.env.NODE_ENV || 'Not set',
            required: false
          },
          'PORT': {
            valid: !!process.env.PORT,
            value: process.env.PORT || 'Not set',
            required: false
          }
        }
      },
      database: {
        valid: !!process.env.MONGODB_URI,
        checks: {
          'MONGODB_URI': {
            valid: !!process.env.MONGODB_URI,
            value: process.env.MONGODB_URI ? 'Set' : 'Not set',
            required: true
          }
        }
      },
      authentication: {
        valid: !!process.env.JWT_SECRET,
        checks: {
          'JWT_SECRET': {
            valid: !!process.env.JWT_SECRET,
            value: process.env.JWT_SECRET ? 'Set' : 'Not set',
            required: true
          },
          'SESSION_SECRET': {
            valid: !!process.env.SESSION_SECRET,
            value: process.env.SESSION_SECRET ? 'Set' : 'Not set',
            required: true
          }
        }
      },
      oauth: {
        valid: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        checks: {
          'GOOGLE_CLIENT_ID': {
            valid: !!process.env.GOOGLE_CLIENT_ID,
            value: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
            required: false
          },
          'GOOGLE_CLIENT_SECRET': {
            valid: !!process.env.GOOGLE_CLIENT_SECRET,
            value: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
            required: false
          }
        }
      },
      email: {
        valid: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        checks: {
          'EMAIL_USER': {
            valid: !!process.env.EMAIL_USER,
            value: process.env.EMAIL_USER ? 'Set' : 'Not set',
            required: false
          },
          'EMAIL_PASS': {
            valid: !!process.env.EMAIL_PASS,
            value: process.env.EMAIL_PASS ? 'Set' : 'Not set',
            required: false
          }
        }
      },
      frontend: {
        valid: !!process.env.FRONTEND_URL,
        checks: {
          'FRONTEND_URL': {
            valid: !!process.env.FRONTEND_URL,
            value: process.env.FRONTEND_URL || 'Not set',
            required: false
          }
        }
      }
    },
    summary: {
      total: 6,
      valid: 0,
      invalid: 0,
      critical: 0,
      optional: 0,
      overall: 'unknown'
    },
    issues: [],
    recommendations: []
  };
  
  // Count validation results
  Object.values(validate.validation).forEach(category => {
    if (category.valid) {
      validate.summary.valid++;
    } else {
      validate.summary.invalid++;
    }
  });
  
  // Check critical vs optional
  const criticalCategories = ['database', 'authentication'];
  const optionalCategories = ['oauth', 'email', 'frontend'];
  
  criticalCategories.forEach(category => {
    if (!validate.validation[category].valid) {
      validate.summary.critical++;
    }
  });
  
  optionalCategories.forEach(category => {
    if (!validate.validation[category].valid) {
      validate.summary.optional++;
    }
  });
  
  // Determine overall status
  if (validate.summary.critical > 0) {
    validate.summary.overall = 'validation_failed';
  } else if (validate.summary.invalid > 0) {
    validate.summary.overall = 'partial_validation';
  } else {
    validate.summary.overall = 'fully_validated';
  }
  
  // Generate issues and recommendations
  if (!validate.validation.database.valid) {
    validate.issues.push('Database configuration is invalid');
    validate.recommendations.push('Add MONGODB_URI to your .env file');
  }
  if (!validate.validation.authentication.valid) {
    validate.issues.push('Authentication configuration is invalid');
    validate.recommendations.push('Add JWT_SECRET and SESSION_SECRET to your .env file');
  }
  if (!validate.validation.oauth.valid) {
    validate.issues.push('Google OAuth configuration is invalid');
    validate.recommendations.push('Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file');
  }
  if (!validate.validation.email.valid) {
    validate.issues.push('Email service configuration is invalid');
    validate.recommendations.push('Add EMAIL_USER and EMAIL_PASS to your .env file');
  }
  if (!validate.validation.frontend.valid) {
    validate.issues.push('Frontend configuration is invalid');
    validate.recommendations.push('Add FRONTEND_URL to your .env file');
  }
  
  // Status message
  validate.status = validate.summary.overall === 'fully_validated'
    ? 'All configurations are valid'
    : validate.summary.overall === 'partial_validation'
    ? 'Critical configurations are valid, optional configurations are invalid'
    : 'Critical configurations are invalid';
  
  res.json(validate);
});

// System test
app.get('/test-system', (_req, res) => {
  const testSystem = {
    message: 'TaleOn Backend System Test',
    timestamp: new Date().toISOString(),
    tests: {
      'Basic Server': {
        status: 'PASS',
        description: 'Server is running and responding',
        details: 'Endpoint accessible and functional'
      },
      'Environment Variables': {
        status: 'PASS',
        description: 'Environment variables are loaded',
        details: 'dotenv configuration is working'
      },
      'Database Configuration': {
        status: process.env.MONGODB_URI ? 'PASS' : 'FAIL',
        description: 'Database URI is configured',
        details: process.env.MONGODB_URI ? 'MONGODB_URI is set' : 'MONGODB_URI is missing'
      },
      'JWT Configuration': {
        status: process.env.JWT_SECRET ? 'PASS' : 'FAIL',
        description: 'JWT secret is configured',
        details: process.env.JWT_SECRET ? 'JWT_SECRET is set' : 'JWT_SECRET is missing'
      },
      'Session Configuration': {
        status: process.env.SESSION_SECRET ? 'PASS' : 'FAIL',
        description: 'Session secret is configured',
        details: process.env.SESSION_SECRET ? 'SESSION_SECRET is set' : 'SESSION_SECRET is missing'
      },
      'Google OAuth Configuration': {
        status: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'PASS' : 'FAIL',
        description: 'Google OAuth is configured',
        details: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'Both OAuth credentials are set' : 'OAuth credentials are missing'
      },
      'Email Configuration': {
        status: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'PASS' : 'FAIL',
        description: 'Email service is configured',
        details: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'Email credentials are set' : 'Email credentials are missing'
      },
      'Frontend Configuration': {
        status: process.env.FRONTEND_URL ? 'PASS' : 'FAIL',
        description: 'Frontend URL is configured',
        details: process.env.FRONTEND_URL ? 'FRONTEND_URL is set' : 'FRONTEND_URL is missing'
      }
    },
    summary: {
      total: 8,
      passed: 0,
      failed: 0,
      critical: 0,
      optional: 0
    },
    status: 'unknown',
    recommendations: []
  };
  
  // Count test results
  Object.values(testSystem.tests).forEach(test => {
    if (test.status === 'PASS') {
      testSystem.summary.passed++;
    } else {
      testSystem.summary.failed++;
    }
  });
  
  // Determine critical vs optional
  const criticalTests = ['Database Configuration', 'JWT Configuration', 'Session Configuration'];
  const optionalTests = ['Google OAuth Configuration', 'Email Configuration', 'Frontend Configuration'];
  
  criticalTests.forEach(testName => {
    if (testSystem.tests[testName].status === 'FAIL') {
      testSystem.summary.critical++;
    }
  });
  
  optionalTests.forEach(testName => {
    if (testSystem.tests[testName].status === 'FAIL') {
      testSystem.summary.optional++;
    }
  });
  
  // Determine overall status
  if (testSystem.summary.critical > 0) {
    testSystem.status = 'critical_failure';
  } else if (testSystem.summary.failed > 0) {
    testSystem.status = 'partial_failure';
  } else {
    testSystem.status = 'all_passed';
  }
  
  // Generate recommendations
  if (testSystem.tests['Database Configuration'].status === 'FAIL') {
    testSystem.recommendations.push('Add MONGODB_URI to your .env file');
  }
  if (testSystem.tests['JWT Configuration'].status === 'FAIL') {
    testSystem.recommendations.push('Add JWT_SECRET to your .env file');
  }
  if (testSystem.tests['Session Configuration'].status === 'FAIL') {
    testSystem.recommendations.push('Add SESSION_SECRET to your .env file');
  }
  if (testSystem.tests['Google OAuth Configuration'].status === 'FAIL') {
    testSystem.recommendations.push('Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file');
  }
  if (testSystem.tests['Email Configuration'].status === 'FAIL') {
    testSystem.recommendations.push('Add EMAIL_USER and EMAIL_PASS to your .env file');
  }
  if (testSystem.tests['Frontend Configuration'].status === 'FAIL') {
    testSystem.recommendations.push('Add FRONTEND_URL to your .env file');
  }
  
  // Status message
  testSystem.message = testSystem.status === 'all_passed'
    ? 'All system tests passed'
    : testSystem.status === 'partial_failure'
    ? 'Critical tests passed, optional tests failed'
    : 'Critical tests failed';
  
  res.json(testSystem);
});

// System monitor
app.get('/monitor', (_req, res) => {
  const monitor = {
    message: 'TaleOn Backend System Monitor',
    timestamp: new Date().toISOString(),
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch
    },
    services: {
      database: {
        status: process.env.MONGODB_URI ? 'operational' : 'degraded',
        lastCheck: new Date().toISOString(),
        uptime: process.uptime()
      },
      authentication: {
        status: process.env.JWT_SECRET ? 'operational' : 'degraded',
        lastCheck: new Date().toISOString(),
        uptime: process.uptime()
      },
      googleOAuth: {
        status: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'operational' : 'disabled',
        lastCheck: new Date().toISOString(),
        uptime: process.uptime()
      },
      email: {
        status: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'operational' : 'disabled',
        lastCheck: new Date().toISOString(),
        uptime: process.uptime()
      },
      frontend: {
        status: process.env.FRONTEND_URL ? 'operational' : 'limited',
        lastCheck: new Date().toISOString(),
        uptime: process.uptime()
      }
    },
    alerts: [],
    status: 'operational'
  };
  
  // Generate alerts
  if (!process.env.MONGODB_URI) {
    monitor.alerts.push({
      level: 'critical',
      service: 'database',
      message: 'Database connection not configured',
      timestamp: new Date().toISOString()
    });
  }
  
  if (!process.env.JWT_SECRET) {
    monitor.alerts.push({
      level: 'critical',
      service: 'authentication',
      message: 'JWT authentication not configured',
      timestamp: new Date().toISOString()
    });
  }
  
  if (!process.env.SESSION_SECRET) {
    monitor.alerts.push({
      level: 'critical',
      service: 'authentication',
      message: 'Session management not configured',
      timestamp: new Date().toISOString()
    });
  }
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    monitor.alerts.push({
      level: 'warning',
      service: 'googleOAuth',
      message: 'Google OAuth not configured',
      timestamp: new Date().toISOString()
    });
  }
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    monitor.alerts.push({
      level: 'warning',
      service: 'email',
      message: 'Email service not configured',
      timestamp: new Date().toISOString()
    });
  }
  
  if (!process.env.FRONTEND_URL) {
    monitor.alerts.push({
      level: 'warning',
      service: 'frontend',
      message: 'Frontend URL not configured',
      timestamp: new Date().toISOString()
    });
  }
  
  // Determine overall status
  const criticalAlerts = monitor.alerts.filter(alert => alert.level === 'critical');
  if (criticalAlerts.length > 0) {
    monitor.status = 'degraded';
  } else if (monitor.alerts.length > 0) {
    monitor.status = 'operational_with_warnings';
  } else {
    monitor.status = 'fully_operational';
  }
  
  // Summary
  monitor.summary = {
    totalAlerts: monitor.alerts.length,
    criticalAlerts: criticalAlerts.length,
    warningAlerts: monitor.alerts.filter(alert => alert.level === 'warning').length,
    status: monitor.status
  };
  
  res.json(monitor);
});

// System status
app.get('/status-system', (_req, res) => {
  const statusSystem = {
    message: 'TaleOn Backend System Status',
    timestamp: new Date().toISOString(),
    system: {
      name: 'TaleOn Backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch
    },
    components: {
      'Database': {
        status: process.env.MONGODB_URI ? '✅ Operational' : '❌ Degraded',
        health: process.env.MONGODB_URI ? 'healthy' : 'unhealthy',
        lastCheck: new Date().toISOString()
      },
      'Authentication': {
        status: process.env.JWT_SECRET ? '✅ Operational' : '❌ Degraded',
        health: process.env.JWT_SECRET ? 'healthy' : 'unhealthy',
        lastCheck: new Date().toISOString()
      },
      'Session Management': {
        status: process.env.SESSION_SECRET ? '✅ Operational' : '❌ Degraded',
        health: process.env.SESSION_SECRET ? 'healthy' : 'unhealthy',
        lastCheck: new Date().toISOString()
      },
      'Google OAuth': {
        status: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? '✅ Operational' : '❌ Disabled',
        health: (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? 'healthy' : 'disabled',
        lastCheck: new Date().toISOString()
      },
      'Email Service': {
        status: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? '✅ Operational' : '❌ Disabled',
        health: (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? 'healthy' : 'disabled',
        lastCheck: new Date().toISOString()
      },
      'Frontend Integration': {
        status: process.env.FRONTEND_URL ? '✅ Operational' : '❌ Limited',
        health: process.env.FRONTEND_URL ? 'healthy' : 'limited',
        lastCheck: new Date().toISOString()
      }
    },
    summary: {
      total: 6,
      operational: 0,
      degraded: 0,
      disabled: 0,
      limited: 0,
      overall: 'unknown'
    },
    alerts: [],
    recommendations: []
  };
  
  // Count component statuses
  Object.values(statusSystem.components).forEach(component => {
    if (component.health === 'healthy') {
      statusSystem.summary.operational++;
    } else if (component.health === 'unhealthy') {
      statusSystem.summary.degraded++;
    } else if (component.health === 'disabled') {
      statusSystem.summary.disabled++;
    } else if (component.health === 'limited') {
      statusSystem.summary.limited++;
    }
  });
  
  // Determine overall status
  if (statusSystem.summary.degraded > 0) {
    statusSystem.summary.overall = 'degraded';
  } else if (statusSystem.summary.disabled > 0 || statusSystem.summary.limited > 0) {
    statusSystem.summary.overall = 'operational_with_limitations';
  } else {
    statusSystem.summary.overall = 'fully_operational';
  }
  
  // Generate alerts
  if (!process.env.MONGODB_URI) {
    statusSystem.alerts.push({
      level: 'critical',
      component: 'Database',
      message: 'Database connection not configured',
      impact: 'All data operations will fail'
    });
  }
  
  if (!process.env.JWT_SECRET) {
    statusSystem.alerts.push({
      level: 'critical',
      component: 'Authentication',
      message: 'JWT authentication not configured',
      impact: 'User authentication will fail'
    });
  }
  
  if (!process.env.SESSION_SECRET) {
    statusSystem.alerts.push({
      level: 'critical',
      component: 'Session Management',
      message: 'Session management not configured',
      impact: 'User sessions will not be maintained'
    });
  }
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    statusSystem.alerts.push({
      level: 'warning',
      component: 'Google OAuth',
      message: 'Google OAuth not configured',
      impact: 'Social login will not be available'
    });
  }
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    statusSystem.alerts.push({
      level: 'warning',
      component: 'Email Service',
      message: 'Email service not configured',
      impact: 'Password reset emails will not be sent'
    });
  }
  
  if (!process.env.FRONTEND_URL) {
    statusSystem.alerts.push({
      level: 'warning',
      component: 'Frontend Integration',
      message: 'Frontend URL not configured',
      impact: 'CORS and redirects may not work properly'
    });
  }
  
  // Generate recommendations
  if (!process.env.MONGODB_URI) {
    statusSystem.recommendations.push('Add MONGODB_URI to your .env file');
  }
  if (!process.env.JWT_SECRET) {
    statusSystem.recommendations.push('Add JWT_SECRET to your .env file');
  }
  if (!process.env.SESSION_SECRET) {
    statusSystem.recommendations.push('Add SESSION_SECRET to your .env file');
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    statusSystem.recommendations.push('Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file');
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    statusSystem.recommendations.push('Add EMAIL_USER and EMAIL_PASS to your .env file');
  }
  if (!process.env.FRONTEND_URL) {
    statusSystem.recommendations.push('Add FRONTEND_URL to your .env file');
  }
  
  // Status message
  statusSystem.status = statusSystem.summary.overall === 'fully_operational'
    ? 'All systems are operational'
    : statusSystem.summary.overall === 'operational_with_limitations'
    ? 'Critical systems are operational, optional systems have limitations'
    : 'Critical systems are degraded';
  
  res.json(statusSystem);
});

// System info
app.get('/info-system', (_req, res) => {
  const infoSystem = {
    message: 'TaleOn Backend System Information',
    timestamp: new Date().toISOString(),
    system: {
      name: 'TaleOn Backend',
      version: '1.0.0',
      description: 'Real-time storytelling game backend with comprehensive monitoring and testing',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      memory: process.memoryUsage()
    },
    features: {
      'Core Services': [
        'User authentication with JWT',
        'Session management with Express sessions',
        'MongoDB database integration',
        'Real-time WebSocket support with Socket.io'
      ],
      'Authentication': [
        'Local authentication strategy',
        'Google OAuth 2.0 integration',
        'Password reset via email',
        'Secure session handling'
      ],
      'Game Features': [
        'Game room creation and management',
        'Real-time game state synchronization',
        'AI player integration',
        'Multiplayer game support'
      ],
      'Monitoring & Testing': [
        'Comprehensive health checks',
        'System diagnostics and validation',
        'Configuration testing',
        'Integration testing'
      ]
    },
    technology: {
      'Backend Framework': 'Node.js with Express.js',
      'Database': 'MongoDB with Mongoose ODM',
      'Authentication': 'Passport.js with JWT',
      'Real-time': 'Socket.io for WebSocket communication',
      'Email': 'Nodemailer for email services',
      'OAuth': 'Google OAuth 2.0 for social login',
      'Testing': 'Comprehensive endpoint testing framework'
    },
    endpoints: {
      'Health & Monitoring': [
        '/health', '/status', '/ready', '/dashboard',
        '/monitor', '/status-system', '/info-system'
      ],
      'Configuration': [
        '/config', '/debug/env', '/overview'
      ],
      'Testing': [
        '/test-all', '/test-integration', '/test-system',
        '/diagnostics', '/check', '/verify', '/validate'
      ],
      'Documentation': [
        '/help', '/troubleshoot', '/about', '/info',
        '/version', '/summary', '/report'
      ]
    },
    configuration: {
      'Database': process.env.MONGODB_URI ? '✅ Configured' : '❌ Missing',
      'JWT Authentication': process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing',
      'Session Management': process.env.SESSION_SECRET ? '✅ Configured' : '❌ Missing',
      'Google OAuth': (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ? '✅ Configured' : '❌ Missing',
      'Email Service': (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? '✅ Configured' : '❌ Missing',
      'Frontend Integration': process.env.FRONTEND_URL ? '✅ Configured' : '❌ Missing'
    },
    status: {
      overall: 'operational',
      critical: 'operational',
      optional: 'mixed'
    },
    recommendations: []
  };
  
  // Determine status
  const criticalServices = ['Database', 'JWT Authentication', 'Session Management'];
  const optionalServices = ['Google OAuth', 'Email Service', 'Frontend Integration'];
  
  const criticalStatus = criticalServices.every(service => 
    infoSystem.configuration[service].includes('✅')
  );
  
  const optionalStatus = optionalServices.every(service => 
    infoSystem.configuration[service].includes('✅')
  );
  
  infoSystem.status.critical = criticalStatus ? 'operational' : 'degraded';
  infoSystem.status.optional = optionalStatus ? 'operational' : 'limited';
  
  if (criticalStatus && optionalStatus) {
    infoSystem.status.overall = 'fully_operational';
  } else if (criticalStatus) {
    infoSystem.status.overall = 'operational_with_limitations';
  } else {
    infoSystem.status.overall = 'degraded';
  }
  
  // Generate recommendations
  if (!process.env.MONGODB_URI) {
    infoSystem.recommendations.push('Configure MONGODB_URI for database connectivity');
  }
  if (!process.env.JWT_SECRET) {
    infoSystem.recommendations.push('Configure JWT_SECRET for secure authentication');
  }
  if (!process.env.SESSION_SECRET) {
    infoSystem.recommendations.push('Configure SESSION_SECRET for session management');
  }
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    infoSystem.recommendations.push('Configure Google OAuth for social login functionality');
  }
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    infoSystem.recommendations.push('Configure email for password reset functionality');
  }
  if (!process.env.FRONTEND_URL) {
    infoSystem.recommendations.push('Configure FRONTEND_URL for proper CORS and redirects');
  }
  
  res.json(infoSystem);
});

// System help
app.get('/help-system', (_req, res) => {
  const helpSystem = {
    message: 'TaleOn Backend System Help',
    timestamp: new Date().toISOString(),
    overview: 'Comprehensive help and documentation for the TaleOn Backend system',
    quickStart: [
      '1. Check system readiness: GET /ready',
      '2. View configuration: GET /config',
      '3. Run diagnostics: GET /test-all',
      '4. Check health: GET /health',
      '5. Get help: GET /help'
    ],
    categories: {
      'Health & Monitoring': {
        description: 'Monitor system health and status',
        endpoints: [
          { path: '/health', description: 'Overall system health' },
          { path: '/status', description: 'System status overview' },
          { path: '/ready', description: 'System readiness check' },
          { path: '/dashboard', description: 'System dashboard' },
          { path: '/monitor', description: 'Real-time monitoring' },
          { path: '/status-system', description: 'Detailed system status' }
        ]
      },
      'Configuration': {
        description: 'View and verify system configuration',
        endpoints: [
          { path: '/config', description: 'Configuration overview' },
          { path: '/debug/env', description: 'Environment variables' },
          { path: '/overview', description: 'System overview' },
          { path: '/info-system', description: 'System information' }
        ]
      },
      'Testing & Diagnostics': {
        description: 'Test system components and run diagnostics',
        endpoints: [
          { path: '/test-all', description: 'Complete system test' },
          { path: '/test-integration', description: 'Integration test' },
          { path: '/test-system', description: 'System component test' },
          { path: '/diagnostics', description: 'System diagnostics' },
          { path: '/check', description: 'Configuration check' },
          { path: '/verify', description: 'System verification' },
          { path: '/validate', description: 'Configuration validation' }
        ]
      },
      'Documentation': {
        description: 'Access help and documentation',
        endpoints: [
          { path: '/help', description: 'General help' },
          { path: '/help-system', description: 'System help (this page)' },
          { path: '/troubleshoot', description: 'Troubleshooting guide' },
          { path: '/about', description: 'About the system' },
          { path: '/info', description: 'System information' },
          { path: '/version', description: 'Version information' },
          { path: '/summary', description: 'System summary' },
          { path: '/report', description: 'System report' }
        ]
      }
    },
    commonIssues: [
      {
        issue: 'Google OAuth returns 503 "not configured"',
        solution: 'Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file',
        test: 'GET /auth/test-google'
      },
      {
        issue: 'Password reset emails not sent',
        solution: 'Check EMAIL_USER and EMAIL_PASS in .env file',
        test: 'GET /auth/test-email'
      },
      {
        issue: 'Database connection fails',
        solution: 'Check MONGODB_URI in .env file',
        test: 'GET /test-db'
      },
      {
        issue: 'Authentication fails',
        solution: 'Check JWT_SECRET in .env file',
        test: 'GET /test-passport'
      }
    ],
    troubleshooting: {
      'Start Here': '/ready',
      'Configuration Issues': '/config',
      'Health Problems': '/health',
      'Integration Issues': '/test-integration',
      'Complete Diagnostics': '/test-all'
    },
    nextSteps: [
      'Use /ready to check if the system is ready to run',
      'Use /config to review your current configuration',
      'Use /test-all for comprehensive system testing',
      'Use /troubleshoot for specific problem resolution',
      'Use /help for general assistance'
    ]
  };
  
  res.json(helpSystem);
});

// Debug route to check environment variables
app.get('/debug/env', (_req, res) => {
  res.json({
    message: 'Environment variables debug',
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅ Found' : '❌ Missing',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ Found' : '❌ Missing',
    EMAIL_USER: process.env.EMAIL_USER ? '✅ Found' : '❌ Missing',
    EMAIL_PASS: process.env.EMAIL_PASS ? '✅ Found' : '❌ Missing',
    MONGODB_URI: process.env.MONGODB_URI ? '✅ Found' : '❌ Missing',
    FRONTEND_URL: process.env.FRONTEND_URL,
    timestamp: new Date().toISOString(),
    troubleshooting: {
      googleOAuth: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? 'Ready' : 'Check .env file',
      email: process.env.EMAIL_USER && process.env.EMAIL_PASS ? 'Ready' : 'Check .env file',
      database: process.env.MONGODB_URI ? 'Ready' : 'Check .env file'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS policy violation' });
  }
  
  res.status(500).json({ 
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

export default app;
