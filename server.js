const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

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
app.use(cors());

// Rate limiting
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 email requests per windowMs
  message: 'Too many email requests from this IP, please try again later.'
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 upload requests per windowMs
  message: 'Too many upload requests from this IP, please try again later.'
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);

// Storage configuration for multer
const storage = multer.diskStorage({
  destination: (req,  cb) => {
    const uploadToken = req.params.token;
    const userUploadDir = path.join(uploadsDir, uploadToken);
    fs.ensureDirSync(userUploadDir);
    cb(null, userUploadDir);
  },
  filename: (file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = path.basename(file.originalname, fileExtension);
    cb(null, `${fileName}-${uniqueSuffix}${fileExtension}`);
  }
});

// File filter for allowed file types
const fileFilter = ( file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and RTF files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
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

// Store for upload tokens (In production, use a database)
const uploadTokens = new Map();

// Routes

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Send email with upload link
app.post('/send-upload-link', emailLimiter, async (req, res) => {
  try {
    const { recipientEmail, senderName, message } = req.body;
    
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    // Generate unique upload token
    const uploadToken = uuidv4();
    const uploadLink = `${req.protocol}://${req.get('host')}/upload/${uploadToken}`;
    
    // Store token with expiration (24 hours)
    uploadTokens.set(uploadToken, {
      recipientEmail,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      used: false
    });

    // Email content
    const emailSubject = 'File Upload Request';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>File Upload Request</h2>
        ${senderName ? `<p><strong>From:</strong> ${senderName}</p>` : ''}
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        <p>Please click the link below to upload your files:</p>
        <a href="${uploadLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
          Upload Files
        </a>
        <p><strong>Note:</strong> This link will expire in 24 hours.</p>
        <p>Accepted file types: PDF, DOC, DOCX, TXT, RTF (Max size: 10MB)</p>
      </div>
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
      message: 'Upload link sent successfully',
      uploadToken: uploadToken // For testing purposes
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Upload page
app.get('/upload/:token', (req, res) => {
  const token = req.params.token;
  const tokenData = uploadTokens.get(token);
  
  if (!tokenData) {
    return res.status(404).send('Invalid or expired upload link');
  }
  
  if (new Date() > tokenData.expiresAt) {
    uploadTokens.delete(token);
    return res.status(410).send('Upload link has expired');
  }
  
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// File upload endpoint
app.post('/upload/:token', uploadLimiter, upload.array('files', 5), (req, res) => {
  try {
    const token = req.params.token;
    const tokenData = uploadTokens.get(token);
    
    if (!tokenData) {
      return res.status(404).json({ error: 'Invalid or expired upload link' });
    }
    
    if (new Date() > tokenData.expiresAt) {
      uploadTokens.delete(token);
      return res.status(410).json({ error: 'Upload link has expired' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const uploadedFiles = req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      path: file.path
    }));
    
    // Mark token as used (optional - remove if multiple uploads are allowed)
    // tokenData.used = true;
    
    res.json({
      success: true,
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Get upload status
app.get('/status/:token', (req, res) => {
  const token = req.params.token;
  const tokenData = uploadTokens.get(token);
  
  if (!tokenData) {
    return res.json({ valid: false, message: 'Invalid token' });
  }
  
  if (new Date() > tokenData.expiresAt) {
    uploadTokens.delete(token);
    return res.json({ valid: false, message: 'Token expired' });
  }
  
  res.json({ 
    valid: true, 
    expiresAt: tokenData.expiresAt,
    recipientEmail: tokenData.recipientEmail
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum 5 files allowed.' });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({ error: error.message });
  }
  
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Make sure to configure your .env file with email settings');
});
