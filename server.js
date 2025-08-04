const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const Profile = require('./models/Profile');
require('dotenv').config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Enhanced CORS configuration for AMP emails
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://mail.google.com',
    'https://gmail.com',
    'https://amp.gmail.dev',
    /\.google\.com$/,
    /\.gmail\.com$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'AMP-CORS-REQUEST-HEADERS',
    'AMP-Same-Origin'
  ]
}));

// Rate limiting
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 email requests per windowMs
  message: 'Too many email requests from this IP, please try again later.'
});

const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 form submissions per windowMs
  message: 'Too many form submissions from this IP, please try again later.'
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// AMP-specific middleware
app.use((req, res, next) => {
  // AMP CORS headers according to https://amp.dev/documentation/guides-and-tutorials/email/learn/cors-in-email
  const origin = req.headers.origin;
  const sourceOrigin = req.headers['amp-same-origin'];
  
  // Handle AMP-specific CORS requirements
  if (sourceOrigin === 'true') {
    // Same origin request from AMP
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else if (origin) {
    // Cross-origin request
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, X-Requested-With');
  
  // AMP-specific required headers
  res.setHeader('Access-Control-Expose-Headers', 'AMP-Access-Control-Allow-Source-Origin');
  
  // For email forms, verify and set the source origin
  if (req.headers['amp-same-origin'] === 'true') {
    res.setHeader('AMP-Access-Control-Allow-Source-Origin', req.protocol + '://' + req.get('host'));
  } else if (req.headers.origin) {
    // For cross-origin requests, verify the origin is allowed
    const allowedOrigins = [
      'https://mail.google.com',
      'https://gmail.com',
      'https://amp.gmail.dev'
    ];
    
    if (allowedOrigins.some(allowed => req.headers.origin.includes('google') || req.headers.origin.includes('gmail'))) {
      res.setHeader('AMP-Access-Control-Allow-Source-Origin', req.headers.origin);
    }
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Email transporter configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Store for tokens (In production, use MongoDB or Redis)
const tokens = new Map();

// Routes

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Test form for direct database testing
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test-form.html'));
});

// Database health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Check MongoDB connection
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    // Test database write/read
    const testResult = await Profile.findOne().limit(1);
    
    res.json({
      success: true,
      database: {
        status: states[dbState],
        connected: dbState === 1,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        testQuery: testResult ? 'success' : 'no_data'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Send email with profile collection link
app.post('/send-upload-link', emailLimiter, async (req, res) => {
  try {
    const { recipientEmail, senderName, message } = req.body;
    
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    // Generate unique token
    const token = uuidv4();
    
    // Determine the base URL - use environment variable if available, otherwise detect
    const baseUrl = process.env.BASE_URL || 
                   (req.get('host').includes('localhost') ? 
                   `${req.protocol}://${req.get('host')}` : 
                   `https://${req.get('host')}`);
    
    const profileLink = `${baseUrl}/profile/${token}`;
    
    console.log('🌐 Using base URL:', baseUrl);
    console.log('🔗 Profile link:', profileLink);
    
    // Store token with expiration (24 hours)
    tokens.set(token, {
      recipientEmail,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      used: false
    });

    // Email content with AMP for Email
    const emailSubject = 'Profile Information Collection';
    
    // AMP Email HTML with interactive components
    const emailHtml = `
<!doctype html>
<html ⚡4email>
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>
  <script async custom-element="amp-selector" src="https://cdn.ampproject.org/v0/amp-selector-0.1.js"></script>
  <script async custom-template="amp-mustache" src="https://cdn.ampproject.org/v0/amp-mustache-0.2.js"></script>
  <style amp4email-boilerplate>body{visibility:hidden}</style>
  <style amp-custom>
    .container {
      max-width: 600px;
      margin: 0 auto;
      font-family: Arial, sans-serif;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .email-card {
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      color: #333;
      margin-bottom: 20px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    .form-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #555;
    }
    .form-input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e1e5e9;
      border-radius: 6px;
      font-size: 16px;
      box-sizing: border-box;
    }
    .form-input:focus {
      border-color: #007bff;
      outline: none;
    }
    .radio-group {
      display: flex;
      gap: 20px;
      margin-top: 10px;
    }
    .radio-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 15px;
      border: 2px solid #e1e5e9;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .radio-option[selected] {
      border-color: #007bff;
      background-color: #f0f7ff;
    }
    .radio-option input {
      margin: 0;
    }
    .textarea {
      min-height: 80px;
      resize: vertical;
    }
    .submit-btn {
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      color: white;
      padding: 12px 30px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: transform 0.2s ease;
    }
    .submit-btn:hover {
      transform: translateY(-1px);
    }
    .info-box {
      background-color: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
    }
    .success-message {
      display: none;
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <div class="header">
        <h2>📋 Profile Information Collection</h2>
        ${senderName ? `<p><strong>From:</strong> ${senderName}</p>` : ''}
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
      </div>

      <div class="info-box">
        <strong>📝 Please fill out this form to update your profile information:</strong>
      </div>

      <!-- Interactive AMP Form -->
      <form method="post" 
            action-xhr="${baseUrl}/api/update-profile"
            custom-validation-reporting="as-you-go">
        
        <input type="hidden" name="token" value="${token}">
        <input type="hidden" name="recipientEmail" value="${recipientEmail}">

        <!-- Name Field -->
        <div class="form-group">
          <label class="form-label" for="fullName">Full Name *</label>
          <input type="text" 
                 id="fullName" 
                 name="fullName" 
                 class="form-input" 
                 placeholder="Enter your full name"
                 required>
        </div>

        <!-- Company Status -->
        <div class="form-group">
          <label class="form-label">Are you still working at the same company? *</label>
          <amp-selector name="companyStatus" 
                       class="radio-group" 
                       layout="container" 
                       required>
            <div class="radio-option" option="yes">
              <input type="radio" name="companyStatus" value="yes" id="company-yes">
              <label for="company-yes">Yes, same company</label>
            </div>
            <div class="radio-option" option="no">
              <input type="radio" name="companyStatus" value="no" id="company-no">
              <label for="company-no">No, changed company</label>
            </div>
          </amp-selector>
        </div>

        <!-- New Skills -->
        <div class="form-group">
          <label class="form-label" for="newSkills">New Skills Acquired</label>
          <textarea id="newSkills" 
                    name="newSkills" 
                    class="form-input textarea" 
                    placeholder="List any new skills, certifications, or technologies you've learned..."></textarea>
        </div>

        <!-- Current Role -->
        <div class="form-group">
          <label class="form-label" for="currentRole">Current Role/Position</label>
          <input type="text" 
                 id="currentRole" 
                 name="currentRole" 
                 class="form-input" 
                 placeholder="Your current job title">
        </div>

        <!-- Company Name -->
        <div class="form-group">
          <label class="form-label" for="companyName">Current Company</label>
          <input type="text" 
                 id="companyName" 
                 name="companyName" 
                 class="form-input" 
                 placeholder="Your current company name">
        </div>

        <!-- Experience Years -->
        <div class="form-group">
          <label class="form-label" for="experienceYears">Years of Experience</label>
          <input type="number" 
                 id="experienceYears" 
                 name="experienceYears" 
                 class="form-input" 
                 placeholder="Total years of work experience"
                 min="0"
                 max="50">
        </div>

        <button type="submit" class="submit-btn">
          💾 Submit Profile Information
        </button>

        <!-- Success message template (hidden by default) -->
        <div submit-success>
          <template type="amp-mustache">
            <div style="background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
              ✅ {{message}}<br>
              <strong>Profile ID:</strong> {{profileId}}<br>
              <strong>Submitted:</strong> {{timestamp}}<br>
              Thank you for updating your profile information!
            </div>
          </template>
        </div>

        <!-- Error message template (hidden by default) -->
        <div submit-error>
          <template type="amp-mustache">
            <div style="background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 6px; padding: 15px; margin: 20px 0;">
              ❌ Error: {{error}}<br>
              <small>Please try again or use the web form link below.</small>
            </div>
          </template>
        </div>

      </form>

      <div class="info-box">
        <strong>📋 Information Collection:</strong>
        <ul style="margin: 10px 0 0 20px;">
          <li>Your information will be stored securely</li>
          <li>All fields are optional except Full Name and Company Status</li>
          <li>This link expires in 24 hours</li>
          <li>You can update your information anytime</li>
        </ul>
      </div>

      <p style="font-size: 12px; color: #666; text-align: center; margin-top: 20px;">
        This is an interactive email. If you can't see the form, 
        <a href="${baseUrl}/profile/${token}">click here to fill the form</a>.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email
    const transporter = createEmailTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml
    });

    res.json({ 
      success: true, 
      message: 'Profile collection link sent successfully',
      token: token // For testing purposes
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Handle CORS preflight for AMP forms
app.options('/api/update-profile', (req, res) => {
  res.sendStatus(200);
});

// AMP form verification endpoint
app.post('/api/verify', (req, res) => {
  console.log('🔍 AMP form verification request received');
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  
  // Simple verification - just return success for valid tokens
  const { token } = req.body;
  
  if (token && (tokens.get(token) || token.startsWith('test-'))) {
    res.json({ verifyErrors: [] });
  } else {
    res.json({ 
      verifyErrors: [
        {
          name: 'token',
          message: 'Invalid or expired form token'
        }
      ]
    });
  }
});

// Handle profile update from interactive email
app.post('/api/update-profile', submissionLimiter, async (req, res) => {
  console.log('\n📝 Profile update request received');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('🌐 IP Address:', req.ip);
  console.log('� Origin:', req.headers.origin);
  console.log('🔧 AMP Same Origin:', req.headers['amp-same-origin']);
  console.log('🔧 User Agent:', req.headers['user-agent']);
  console.log('�📦 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { token, recipientEmail, fullName, companyStatus, newSkills, currentRole, companyName, experienceYears } = req.body;
    
    console.log('🔑 Token received:', token);
    console.log('📧 Email:', recipientEmail);
    console.log('👤 Name:', fullName);
    
    // Validate token exists (allow test tokens)
    let tokenData = tokens.get(token);
    const isTestToken = token && token.startsWith('test-');
    
    console.log('🔍 Token validation:', tokenData ? 'Found ✅' : 'Not found ❌');
    console.log('🧪 Is test token:', isTestToken ? 'Yes' : 'No');
    
    if (!tokenData && !isTestToken) {
      console.log('❌ Invalid token, returning 404');
      return res.status(404).json({ error: 'Invalid submission token' });
    }
    
    // Create mock token data for test tokens
    if (isTestToken && !tokenData) {
      console.log('🧪 Creating mock token data for test');
      tokenData = {
        recipientEmail: recipientEmail || 'test@example.com',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        used: false
      };
    }
    
    if (new Date() > tokenData.expiresAt && !isTestToken) {
      console.log('❌ Token expired, returning 410');
      tokens.delete(token);
      return res.status(410).json({ error: 'Submission token has expired' });
    }
    
    console.log('✅ Token is valid, proceeding with profile creation/update');
    
    // Check if profile already exists for this token
    console.log('🔍 Checking for existing profile...');
    let profile = await Profile.findOne({ token });
    console.log('📄 Existing profile:', profile ? 'Found' : 'Not found');
    
    const profileData = {
      personalInfo: {
        fullName: fullName || '',
        email: recipientEmail || tokenData.recipientEmail,
        phone: '', // Can be added to the form later
        address: '' // Can be added to the form later
      },
      professionalInfo: {
        currentPosition: currentRole || '',
        experience: experienceYears ? `${experienceYears} years` : '',
        skills: newSkills || ''
      },
      additionalInfo: {
        education: '', // Can be added to the form later
        achievements: '', // Can be added to the form later
        goals: '' // Can be added to the form later
      },
      emailSentTo: recipientEmail || tokenData.recipientEmail
    };
    
    console.log('💾 Profile data prepared:', JSON.stringify(profileData, null, 2));
    
    if (profile) {
      // Update existing profile
      console.log('🔄 Updating existing profile...');
      Object.assign(profile, profileData);
      await profile.save();
      console.log('✅ Profile updated successfully:', profile.profileId);
    } else {
      // Create new profile
      console.log('➕ Creating new profile...');
      profile = new Profile({
        profileId: uuidv4(),
        token,
        ...profileData
      });
      await profile.save();
      console.log('✅ New profile created successfully:', profile.profileId);
    }
    
    // Update token data with profile information
    tokenData.profileData = profile;
    
    // Log the profile update
    console.log('📊 Profile summary:', {
      profileId: profile.profileId,
      fullName,
      companyStatus,
      currentRole,
      companyName
    });
    
    // Return success response for AMP form
    const response = {
      success: true,
      message: 'Profile information submitted successfully',
      profileId: profile.profileId,
      timestamp: new Date(profile.submittedAt).toLocaleString()
    };
    
    console.log('📤 Sending response:', response);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    console.error('📊 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // More specific error responses
    let errorMessage = 'Failed to submit profile information';
    let statusCode = 500;
    
    if (error.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + Object.values(error.errors).map(e => e.message).join(', ');
      statusCode = 400;
    } else if (error.name === 'MongooseError' || error.name === 'MongoError') {
      errorMessage = 'Database error: ' + error.message;
      statusCode = 503;
    } else if (error.code === 11000) {
      errorMessage = 'Profile already exists for this token';
      statusCode = 409;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Profile form page
app.get('/profile/:token', (req, res) => {
  const token = req.params.token;
  const tokenData = tokens.get(token);
  
  if (!tokenData) {
    return res.status(404).send('Invalid or expired form link');
  }
  
  if (new Date() > tokenData.expiresAt) {
    tokens.delete(token);
    return res.status(410).send('Form link has expired');
  }
  
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Get all stored profiles (for admin view)
app.get('/api/profiles', async (req, res) => {
  try {
    // Get all profiles from MongoDB
    const profiles = await Profile.find({})
      .sort({ submittedAt: -1 }) // Most recent first
      .lean(); // Return plain JavaScript objects
    
    res.json({
      success: true,
      count: profiles.length,
      profiles: profiles
    });
  } catch (error) {
    console.error('Error reading profiles:', error);
    res.status(500).json({ error: 'Failed to load profiles' });
  }
});

// Get single profile by ID
app.get('/api/profiles/:id', async (req, res) => {
  try {
    const profileId = req.params.id;
    
    // Find profile in MongoDB
    const profile = await Profile.findOne({ profileId }).lean();
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json({
      success: true,
      profile: profile
    });
  } catch (error) {
    console.error('Error reading profile:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// Get form status
app.get('/status/:token', (req, res) => {
  const token = req.params.token;
  const tokenData = tokens.get(token);
  
  if (!tokenData) {
    return res.json({ valid: false, message: 'Invalid token' });
  }
  
  if (new Date() > tokenData.expiresAt) {
    tokens.delete(token);
    return res.json({ valid: false, message: 'Token expired' });
  }
  
  res.json({ 
    valid: true, 
    expiresAt: tokenData.expiresAt,
    recipientEmail: tokenData.recipientEmail,
    profileSubmitted: !!tokenData.profileData
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  
  if (error.message.includes('Invalid file')) {
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Profile Collection Service - Ready to collect user profiles');
  console.log('Make sure to configure your .env file with email settings');
  
  // Warning about localhost for AMP emails
  if (process.env.NODE_ENV !== 'production' && !process.env.BASE_URL) {
    console.log('\n⚠️  WARNING: AMP EMAIL FORMS WILL NOT WORK WITH LOCALHOST!');
    console.log('   Gmail cannot reach localhost:3000 from their servers.');
    console.log('   To test AMP forms properly:');
    console.log('   1. Deploy to Vercel: npm run deploy');
    console.log('   2. Or use ngrok: ngrok http 3000');
    console.log('   3. Update BASE_URL in .env with the public URL\n');
  }
});
