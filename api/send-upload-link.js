const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

// In-memory storage (not persistent in serverless)
// In production, use a database like MongoDB, PostgreSQL, or Redis
const uploadTokens = new Map();

const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recipientEmail, senderName, message } = req.body;
    
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }

    // Generate unique upload token
    const uploadToken = uuidv4();
    const uploadLink = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/upload/${uploadToken}`;
    
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
        <p><em>⚠️ Note: This is a demo deployment. Files are stored temporarily.</em></p>
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

    res.status(200).json({ 
      success: true, 
      message: 'Upload link sent successfully',
      uploadToken: uploadToken // For testing purposes
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email. Please check your email configuration.' });
  }
};
