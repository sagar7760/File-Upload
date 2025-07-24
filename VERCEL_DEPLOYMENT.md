# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Email Configuration**: Your Gmail app password should be ready

## Deployment Steps

### 1. Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### 2. Environment Variables
In your Vercel dashboard, add these environment variables:

```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Deploy Options

#### Option A: GitHub/GitLab Integration (Recommended)
1. Push your code to GitHub/GitLab
2. Connect your repository to Vercel
3. Vercel will automatically deploy

#### Option B: Vercel CLI
```bash
vercel --prod
```

#### Option C: Drag & Drop
1. Zip your project folder
2. Go to Vercel dashboard
3. Drag and drop the zip file

## Important Limitations on Vercel

### 🚨 File Storage
- **Issue**: Vercel serverless functions don't have persistent file storage
- **Solution**: Files are processed but not permanently stored in this demo
- **Production Fix**: Use external storage like AWS S3, Cloudinary, or similar

### 🚨 Token Persistence
- **Issue**: In-memory token storage is lost between function invocations
- **Solution**: Tokens work within session but don't persist
- **Production Fix**: Use database like MongoDB, PostgreSQL, or Redis

### 🚨 Function Timeout
- **Issue**: Vercel free tier has 10s timeout, Pro has 60s
- **Solution**: File uploads are limited by this timeout
- **Production Fix**: Use background jobs or streaming uploads

## Production Recommendations

For a production deployment, consider these improvements:

### 1. Database Integration
```javascript
// Replace in-memory storage with database
const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  token: String,
  recipientEmail: String,
  createdAt: Date,
  expiresAt: Date,
  used: Boolean
});
```

### 2. File Storage Service
```javascript
// Use cloud storage
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// Or use Cloudinary
const cloudinary = require('cloudinary').v2;
```

### 3. Environment Variables for Production
```env
# Database
MONGODB_URI=mongodb://...
# or
DATABASE_URL=postgresql://...

# File Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...

# Or Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Alternative Deployment Platforms

If you need persistent file storage without external services:

### 1. Railway
- Supports persistent storage
- Easy deployment
- Good for Node.js apps

### 2. Render
- Persistent disks available
- Free tier includes storage
- Good performance

### 3. DigitalOcean App Platform
- Persistent storage
- Managed database options
- Scalable

### 4. Heroku
- Add-ons for storage and database
- Easy deployment
- Good ecosystem

## Testing Your Deployment

1. Visit your Vercel URL
2. Send a test email to yourself
3. Check that the email is received
4. Click the upload link
5. Try uploading a file (will be processed but not stored)

## Troubleshooting

### Email Issues
- Check environment variables are set correctly
- Verify Gmail app password is valid
- Check Vercel function logs

### Upload Issues
- Remember files aren't permanently stored on Vercel
- Check file size limits
- Verify CORS headers

### Function Timeouts
- Large files may timeout
- Consider upgrading to Vercel Pro
- Or switch to a platform with persistent storage

## Cost Considerations

- **Vercel Hobby**: Free, but limited
- **Vercel Pro**: $20/month, better limits
- **External Storage**: Additional costs for S3, Cloudinary, etc.
- **Database**: Additional costs for managed databases

## Summary

This Vercel deployment works as a demo but has limitations. For production use, you'll need:
1. External file storage (S3, Cloudinary)
2. Database for token persistence (MongoDB, PostgreSQL)
3. Possibly a different hosting platform for simpler architecture
