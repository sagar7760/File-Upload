<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# File Upload Service - Copilot Instructions

This is a Node.js Express application for secure file upload with email functionality.

## Project Context
- **Purpose**: Send email links for secure file uploads (PDF, DOC, DOCX, TXT, RTF)
- **Tech Stack**: Node.js, Express, Multer, Nodemailer, vanilla JavaScript frontend
- **Security**: Rate limiting, file validation, token-based access, CORS protection

## Code Style Guidelines
- Use ES6+ features where appropriate
- Follow RESTful API conventions
- Implement proper error handling with try-catch blocks
- Use descriptive variable and function names
- Add JSDoc comments for complex functions
- Validate all inputs on both frontend and backend

## Security Best Practices
- Always validate file types and sizes
- Implement rate limiting for email sending and file uploads
- Use secure headers with Helmet.js
- Sanitize user inputs
- Generate secure random tokens for upload links
- Set appropriate file upload limits

## File Organization
- Keep route handlers in server.js
- Store static files in public/ directory
- Store uploaded files in uploads/ directory (organized by token)
- Use environment variables for sensitive configuration

## Error Handling
- Return appropriate HTTP status codes
- Provide clear error messages to users
- Log errors for debugging purposes
- Handle multer errors specifically (file size, type, etc.)

## Frontend Guidelines
- Use vanilla JavaScript (no frameworks)
- Implement progressive enhancement
- Provide visual feedback for user actions
- Handle drag-and-drop file uploads
- Show upload progress with XMLHttpRequest
- Validate files on the client side before upload

## API Design
- Use RESTful endpoints
- Return consistent JSON responses
- Include proper HTTP status codes
- Implement request/response validation
- Use middleware for common functionality

When working on this project, prioritize security, user experience, and maintainable code structure.
