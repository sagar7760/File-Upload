# File Upload Service

A secure web application that sends email links for file uploads. Users receive an email with a unique, time-limited link to upload files (PDF, DOC, DOCX, TXT, RTF) which are then stored securely on the server.

## Features

- 📧 **Email Integration**: Send secure upload links via email
- 🔒 **Security**: Rate limiting, file type validation, and secure file storage
- ⏰ **Time-Limited Links**: Upload links expire after 24 hours
- 📁 **Multiple File Support**: Upload up to 5 files at once (max 10MB each)
- 🎨 **Modern UI**: Responsive web interface with drag-and-drop support
- 🛡️ **Input Validation**: Comprehensive file type and size validation

## Supported File Types

- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Text files (.txt)
- Rich Text Format (.rtf)

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

Edit `.env` file with your email configuration:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
PORT=3000
```

### 3. Email Configuration

#### For Gmail:
1. Enable 2-Step Verification in your Google Account
2. Go to Google Account > Security > 2-Step Verification > App passwords
3. Generate an app password for "Mail"
4. Use this app password in the `EMAIL_PASS` field

#### For Other Email Services:
- **Outlook/Hotmail**: Use `EMAIL_SERVICE=hotmail`
- **Yahoo**: Use `EMAIL_SERVICE=yahoo`
- **Custom SMTP**: See `.env.example` for custom SMTP configuration

### 4. Run the Application

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Usage

### Sending Upload Links

1. Open `http://localhost:3000` in your browser
2. Enter the recipient's email address
3. Optionally add your name and a message
4. Click "Send Upload Link"
5. The recipient will receive an email with a secure upload link

### Uploading Files

1. Recipients click the link in their email
2. The upload interface opens in their browser
3. They can drag and drop files or click to select them
4. Files are validated and uploaded securely
5. Upload links expire after 24 hours

## API Endpoints

### POST `/send-upload-link`
Send an upload link via email.

**Body:**
```json
{
  "recipientEmail": "user@example.com",
  "senderName": "John Doe (optional)",
  "message": "Please upload your documents (optional)"
}
```

### GET `/upload/:token`
Display the upload interface for a specific token.

### POST `/upload/:token`
Upload files using a valid token.

### GET `/status/:token`
Check if an upload token is valid and not expired.

## File Storage

Uploaded files are stored in the `uploads/` directory, organized by upload token:

```
uploads/
├── token-1/
│   ├── document-1234567890.pdf
│   └── resume-0987654321.docx
└── token-2/
    └── report-1122334455.pdf
```

## Security Features

- **Rate Limiting**: Prevents spam and abuse
- **File Validation**: Strict file type and size checking
- **Secure Headers**: Helmet.js for security headers
- **CORS Protection**: Configurable cross-origin resource sharing
- **Token Expiration**: Automatic cleanup of expired tokens
- **Input Sanitization**: Prevents malicious file uploads

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_SERVICE` | Email service provider | `gmail` |
| `EMAIL_USER` | Your email address | Required |
| `EMAIL_PASS` | Your email password/app password | Required |
| `PORT` | Server port | `3000` |

### File Upload Limits

- **Maximum file size**: 10MB per file
- **Maximum files per upload**: 5 files
- **Allowed file types**: PDF, DOC, DOCX, TXT, RTF
- **Link expiration**: 24 hours

## Development

### Project Structure

```
├── server.js              # Main server file
├── public/
│   ├── index.html         # Email sending interface
│   └── upload.html        # File upload interface
├── uploads/               # File storage directory
├── .env                   # Environment configuration
├── .env.example          # Environment template
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

### Adding Custom Email Templates

The email content is defined in the `server.js` file. You can customize the HTML template in the `/send-upload-link` route.

### Extending File Type Support

To add support for additional file types:

1. Update the `allowedTypes` array in `server.js`
2. Update the file filter in the multer configuration
3. Update the frontend validation in `upload.html`
4. Update the documentation

## Troubleshooting

### Email Not Sending

1. **Check email credentials**: Ensure `EMAIL_USER` and `EMAIL_PASS` are correct
2. **App passwords**: For Gmail, use an app password, not your regular password
3. **Less secure apps**: Some email providers require enabling "less secure app access"
4. **Firewall**: Ensure your network allows SMTP connections

### File Upload Issues

1. **File size**: Check that files are under 10MB
2. **File type**: Ensure files have supported extensions
3. **Network**: Check for network connectivity issues
4. **Token expiration**: Verify the upload link hasn't expired

### Common Error Messages

- `"Invalid file type"`: File extension not supported
- `"File size too large"`: File exceeds 10MB limit
- `"Upload link has expired"`: Token is older than 24 hours
- `"Too many requests"`: Rate limit exceeded

## Production Deployment

### Security Recommendations

1. **Use HTTPS**: Always use SSL/TLS in production
2. **Environment Variables**: Never commit `.env` files
3. **File Storage**: Consider cloud storage for scalability
4. **Database**: Replace in-memory token storage with a database
5. **Monitoring**: Add logging and monitoring
6. **Backup**: Implement regular backups of uploaded files

### Scaling Considerations

- **Database**: Use Redis or a database for token storage
- **File Storage**: Use AWS S3, Google Cloud Storage, or similar
- **Load Balancing**: Use multiple server instances
- **CDN**: Serve static files through a CDN

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please check the troubleshooting section or create an issue in the project repository.
