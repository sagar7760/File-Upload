# Profile Collection Service

A secure web application that sends email links for profile information collection. Users receive an email with a unique, time-limited link to fill out their profile information which is then stored in MongoDB.

## Features

- 📧 **Email Integration**: Send secure profile collection links via email
- 📝 **Interactive Forms**: AMP-powered email forms with real-time validation
- 🔒 **Security**: Rate limiting, input validation, and secure token management
- ⏰ **Time-Limited Links**: Profile links expire after 24 hours
- 🗄️ **MongoDB Storage**: Profile data stored in MongoDB database
- 📊 **Admin Dashboard**: View and export collected profile data
- 🎨 **Modern UI**: Responsive web interface with interactive components
- ☁️ **Vercel Compatible**: Serverless deployment ready

## Profile Information Collected

- Full Name (required)
- Company Status - Same/Changed (required)
- Current Role/Position
- Current Company Name
- Years of Experience
- New Skills Acquired

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your email settings:

```bash
copy .env.example .env
```

Edit `.env` file with your email and MongoDB configuration:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
MONGODB_URI=mongodb://localhost:27017/profile-collection
PORT=3000
```

### 3. Database Setup

#### Local MongoDB:
```bash
# Install MongoDB locally or use MongoDB Atlas (cloud)
# For local installation, start MongoDB service
mongod
```

#### MongoDB Atlas (Recommended for Production):
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in your `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/profile-collection?retryWrites=true&w=majority
```

### 4. Email Configuration

#### For Gmail:
1. Enable 2-Step Verification in your Google Account
2. Go to Google Account > Security > 2-Step Verification > App passwords
3. Generate an app password for "Mail"
4. Use this app password in the `EMAIL_PASS` field

#### For Other Email Services:
- **Outlook/Hotmail**: Use `EMAIL_SERVICE=hotmail`
- **Yahoo**: Use `EMAIL_SERVICE=yahoo`
- **Custom SMTP**: See `.env.example` for custom SMTP configuration

### 5. Run the Application

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

### Sending Profile Collection Links

1. Open `http://localhost:3000` in your browser
2. Enter the recipient's email address
3. Optionally add your name and a message
4. Click "Send Profile Collection Link"
5. The recipient will receive an email with a secure profile form link

### Filling Profile Information

1. Recipients click the link in their email
2. They can fill out the form directly in the email (AMP-enabled) or click to open the web form
3. Required fields: Full Name and Company Status
4. Optional fields: Current Role, Company, Experience, New Skills
5. Profile information is submitted and stored locally
6. Profile links expire after 24 hours

### Admin Dashboard

1. Visit `http://localhost:3000/admin` to view collected profiles
2. See statistics: Total profiles, today's submissions, this week's submissions
3. Export profile data as CSV for analysis
4. Dashboard auto-refreshes every 30 seconds

## API Endpoints

### POST `/send-upload-link`
Send a profile collection link via email.

**Body:**
```json
{
  "recipientEmail": "user@example.com",
  "senderName": "John Doe (optional)",
  "message": "Please fill out your profile information (optional)"
}
```

### GET `/profile/:token`
Display the profile form interface for a specific token.

### POST `/api/update-profile`
Submit profile information using a valid token.

**Body:**
```json
{
  "token": "token-uuid",
  "recipientEmail": "user@example.com",
  "fullName": "John Doe",
  "companyStatus": "yes|no",
  "currentRole": "Software Engineer (optional)",
  "companyName": "Tech Corp (optional)",
  "experienceYears": "5 (optional)",
  "newSkills": "React, Node.js (optional)"
}
```

### GET `/api/profiles`
Get all collected profile data (admin endpoint).

### GET `/status/:token`
Check if a profile token is valid and not expired.

## Data Storage

Profile data is stored in MongoDB with the following schema:

### Profile Data Structure

```json
{
  "profileId": "unique-profile-id",
  "token": "unique-token",
  "personalInfo": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "",
    "address": ""
  },
  "professionalInfo": {
    "currentPosition": "Software Engineer",
    "experience": "5 years",
    "skills": "React, Node.js, MongoDB"
  },
  "additionalInfo": {
    "education": "",
    "achievements": "",
    "goals": ""
  },
  "submittedAt": "2024-01-15T10:30:00.000Z",
  "emailSentTo": "john@example.com",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
  "recipientEmail": "user@example.com",
  "fullName": "John Doe",
  "companyStatus": "yes",
  "currentRole": "Software Engineer",
  "companyName": "Tech Corp",
  "experienceYears": 5,
  "newSkills": "React, Node.js, TypeScript",
  "submittedAt": "2025-01-01T12:00:00.000Z",
  "updatedAt": "2025-01-01T12:00:00.000Z"
}
```

## Migration to MongoDB

The current local storage system is designed to be easily migrated to MongoDB:

```javascript
// Example MongoDB schema
const profileSchema = new mongoose.Schema({
  uploadToken: { type: String, required: true, unique: true },
  recipientEmail: { type: String, required: true },
  fullName: { type: String, required: true },
  companyStatus: { type: String, enum: ['yes', 'no'], required: true },
  currentRole: String,
  companyName: String,
  experienceYears: Number,
  newSkills: String,
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

## Security Features

- **Rate Limiting**: Prevents spam and abuse
- **Input Validation**: Strict form data validation
- **Secure Headers**: Helmet.js for security headers
- **CORS Protection**: Configurable cross-origin resource sharing
- **Token Expiration**: Automatic cleanup of expired tokens
- **XSS Prevention**: Input sanitization and output encoding

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_SERVICE` | Email service provider | `gmail` |
| `EMAIL_USER` | Your email address | Required |
| `EMAIL_PASS` | Your email password/app password | Required |
| `PORT` | Server port | `3000` |

### Profile Collection Settings

- **Link expiration**: 24 hours
- **Rate limiting**: 5 emails per 15 minutes per IP
- **Form submissions**: 10 submissions per 15 minutes per IP
- **Required fields**: Full Name, Company Status
- **Optional fields**: Role, Company, Experience, Skills

## Development

### Project Structure

```
├── server.js              # Main server file
├── public/
│   ├── index.html         # Email sending interface
│   ├── profile.html       # Profile form interface
│   └── admin.html         # Admin dashboard
├── data/
│   └── profiles.json      # Local profile storage
├── api/                   # Serverless functions (Vercel)
│   ├── index.js          # Main page serverless function
│   ├── send-upload-link.js # Email sending function
│   ├── update-profile.js  # Profile submission function
│   ├── profiles.js       # Profile data retrieval function
│   └── status.js         # Token validation function
├── .env                  # Environment configuration
├── .env.example         # Environment template
├── package.json         # Dependencies and scripts
├── vercel.json          # Vercel deployment configuration
└── README.md            # This file
```

**Why Two Folder Structures?**
- `server.js` + `public/` → Traditional server deployment (local/VPS)
- `api/` + `public/` → Serverless deployment (Vercel)
- `server.js` handles all routes in one process, while `api/*.js` creates individual serverless functions
- Both approaches serve the same `public/` files but use different backend architectures

### Adding Custom Email Templates

The email content is defined in the `server.js` file and `api/send-upload-link.js`. You can customize the HTML template in the email sending functions.

### Extending Profile Fields

To add additional profile fields:

1. Update the form in `public/profile.html`
2. Update the API endpoints in `server.js` and `api/update-profile.js`
3. Update the email template to include new fields
4. Update the admin dashboard to display new fields

## Troubleshooting

### Email Not Sending

1. **Check email credentials**: Ensure `EMAIL_USER` and `EMAIL_PASS` are correct
2. **App passwords**: For Gmail, use an app password, not your regular password
3. **Less secure apps**: Some email providers require enabling "less secure app access"
4. **Firewall**: Ensure your network allows SMTP connections

### Profile Submission Issues

1. **Required fields**: Ensure Full Name and Company Status are filled
2. **Network**: Check for network connectivity issues
3. **Token expiration**: Verify the profile link hasn't expired
4. **Data storage**: Check that the `data/` directory is writable

### Common Error Messages

- `"Full name is required"`: Required field not filled
- `"Company status is required"`: Required field not filled
- `"Profile link has expired"`: Token is older than 24 hours
- `"Too many requests"`: Rate limit exceeded

## Production Deployment

### Vercel Deployment with MongoDB

**✅ Yes, Vercel fully supports MongoDB!** Serverless functions work perfectly with MongoDB Atlas.

1. **Prepare for Vercel**:
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Set Environment Variables in Vercel**:
   ```bash
   vercel env add EMAIL_SERVICE
   vercel env add EMAIL_USER  
   vercel env add EMAIL_PASS
   vercel env add MONGODB_URI
   ```

   Or through Vercel Dashboard:
   - Go to your project settings
   - Add environment variables:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `EMAIL_SERVICE`: gmail
     - `EMAIL_USER`: your-email@gmail.com
     - `EMAIL_PASS`: your-app-password

3. **Deploy**:
   ```bash
   vercel --prod
   ```

**MongoDB Atlas Recommended**: MongoDB Atlas (cloud) is the best choice for Vercel deployment as it:
- Provides global availability
- Handles connection pooling automatically
- Works seamlessly with serverless functions
- Offers free tier for development

### Vercel + MongoDB Benefits

- **Serverless Functions**: Each API endpoint runs independently
- **Auto-scaling**: Handles traffic spikes automatically  
- **Global CDN**: Fast content delivery worldwide
- **Zero Configuration**: Works out of the box with MongoDB Atlas
- **Environment Variables**: Secure credential management

### Traditional Server Deployment

1. **Clone and install**:
   ```bash
   git clone <your-repo>
   cd profile-collection-service
   npm install
   ```

2. **Set environment variables**
3. **Run with PM2** (recommended):
   ```bash
   npm install -g pm2
   pm2 start server.js --name "profile-service"
   ```

### Security Recommendations

1. **Use HTTPS**: Always use SSL/TLS in production
2. **Environment Variables**: Never commit `.env` files
3. **Data Storage**: Consider MongoDB Atlas for production data storage
4. **Database**: Replace in-memory token storage with a database
5. **Monitoring**: Add logging and monitoring
6. **Backup**: Implement regular backups of profile data

### Scaling Considerations

- **Database**: Migrate to MongoDB or PostgreSQL for production
- **Session Storage**: Use Redis for token management
- **File Storage**: Profile data is lightweight, but consider database scaling
- **Load Balancing**: Use multiple server instances
- **CDN**: Serve static files through a CDN

## License

MIT License - see LICENSE file for details

## License

MIT License - see LICENSE file for details.

