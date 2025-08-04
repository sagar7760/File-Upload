const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

// In-memory storage (not persistent in serverless)
// In production, use a database like MongoDB, PostgreSQL, or Redis
const uploadTokens = new Map();

const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Simple body parser for Vercel
const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
};

module.exports = async (req, res) => {
  // Enhanced CORS headers for AMP emails
  const origin = req.headers.origin;
  const sourceOrigin = req.headers['amp-same-origin'];
  
  // Handle AMP-specific CORS requirements
  if (sourceOrigin === 'true') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, X-Requested-With');
  
  // AMP-specific required headers
  res.setHeader('Access-Control-Expose-Headers', 'AMP-Access-Control-Allow-Source-Origin');
  
  // For email forms, verify and set the source origin
  if (req.headers['amp-same-origin'] === 'true') {
    res.setHeader('AMP-Access-Control-Allow-Source-Origin', `https://${req.headers.host}`);
  } else if (req.headers.origin) {
    const allowedOrigins = [
      'https://mail.google.com',
      'https://gmail.com',
      'https://amp.gmail.dev'
    ];
    
    if (allowedOrigins.some(allowed => req.headers.origin.includes('google') || req.headers.origin.includes('gmail'))) {
      res.setHeader('AMP-Access-Control-Allow-Source-Origin', req.headers.origin);
    }
  }
  
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    const body = await parseBody(req);
    const { recipientEmail, senderName, message } = body;
    
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    // Generate unique token for form submission
    const token = uuidv4();
    
    // Determine the base URL - use HTTPS for Vercel
    const baseUrl = `https://${req.headers.host}`;
    const profileLink = `${baseUrl}/profile/${token}`;
    
    console.log('🌐 Using base URL:', baseUrl);
    console.log('🔗 Profile link:', profileLink);
    
    // Store token with expiration (24 hours)
    uploadTokens.set(token, {
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

    // Fallback plain text email for non-AMP clients
    const plainTextFallback = `
      Profile Information Collection
      
      ${senderName ? `From: ${senderName}` : ''}
      ${message ? `Message: ${message}` : ''}
      
      Please visit this link to fill out your profile information:
      ${profileLink}
      
      Note: This link will expire in 24 hours.
      Information to collect: Name, Company Status, Current Role, Skills, Experience
      
      Your information will be stored securely for profile updates.
    `;

    // Send email with AMP support
    const transporter = createEmailTransporter();
    
    console.log('📧 Attempting to send email...');
    console.log('📝 Email service:', process.env.EMAIL_SERVICE);
    console.log('👤 Email user:', process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + '***' : 'NOT SET');
    console.log('🔑 Email pass:', process.env.EMAIL_PASS ? 'SET (length: ' + process.env.EMAIL_PASS.length + ')' : 'NOT SET');
    console.log('📨 Sending to:', recipientEmail);
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml,
      text: plainTextFallback, // Fallback for clients that don't support HTML
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'AMP-Email-Allow-Sender': 'true'
      }
    });

    console.log('✅ Profile collection email sent successfully to:', recipientEmail);

    res.status(200).json({ 
      success: true, 
      message: 'Profile collection link sent successfully',
      token: token // For testing purposes
    });

  } catch (error) {
    console.error('❌ Email sending error:', error);
    console.error('📋 Error message:', error.message);
    console.error('📋 Error code:', error.code);
    console.error('📋 Error stack:', error.stack);
    
    // More specific error handling
    let errorMessage = 'Failed to send email. ';
    
    if (error.code === 'EAUTH') {
      errorMessage += 'Authentication failed. Please check your email credentials.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage += 'Network error. Please check your internet connection.';
    } else if (error.message && error.message.includes('Invalid login')) {
      errorMessage += 'Invalid email login credentials.';
    } else {
      errorMessage += 'Please check your email configuration. Error: ' + error.message;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: error.code
    });
  }
};
