const path = require('path');

module.exports = (req, res) => {
  // Serve the main page
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile Collection Service</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            max-width: 500px;
            width: 100%;
        }
        
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 2rem;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 600;
        }
        
        input[type="email"],
        input[type="text"],
        textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        
        input[type="email"]:focus,
        input[type="text"]:focus,
        textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        
        textarea {
            resize: vertical;
            min-height: 100px;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
            width: 100%;
        }
        
        .btn:hover {
            transform: translateY(-2px);
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .alert {
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        
        .alert.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .loading {
            display: none;
            text-align: center;
            margin-top: 20px;
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            font-size: 14px;
            color: #6c757d;
        }
        
        .warning {
            background-color: #fff2c5ff;
            color: #ffa08dff;
            border: 1px solid #ffeaa7;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>� Profile Collection Service</h1>
        
        <div class="warning">
            <strong>⚠️ Demo Mode</strong> 
        </div>
        
        <div id="alert" class="alert"></div>
        
        <form id="emailForm">
            <div class="form-group">
                <label for="recipientEmail">Recipient Email *</label>
                <input type="email" id="recipientEmail" name="recipientEmail" required>
            </div>
            
            <div class="form-group">
                <label for="senderName">Your Name (Optional)</label>
                <input type="text" id="senderName" name="senderName">
            </div>
            
            <div class="form-group">
                <label for="message">Message (Optional)</label>
                <textarea id="message" name="message" placeholder="Enter a message to include with the profile collection request..."></textarea>
            </div>
            
            <button type="submit" class="btn" id="sendBtn">Send Profile Collection Link</button>
        </form>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Sending email...</p>
        </div>
        
        <div class="info">
            <strong>How it works:</strong>
            <ul style="margin-top: 10px; margin-left: 20px;">
                <li>Enter the recipient's email address</li>
                <li>Add an optional message</li>
                <li>The recipient will receive an email with a secure profile form link</li>
                <li>The link expires in 24 hours</li>
                <li>Profile data is stored locally and can be exported later</li>
            </ul>
        </div>
    </div>

    <script>
        document.getElementById('emailForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            const alertDiv = document.getElementById('alert');
            const loadingDiv = document.getElementById('loading');
            const sendBtn = document.getElementById('sendBtn');
            
            // Reset alert
            alertDiv.style.display = 'none';
            alertDiv.className = 'alert';
            
            // Show loading
            loadingDiv.style.display = 'block';
            sendBtn.disabled = true;
            
            try {
                const response = await fetch('/send-upload-link', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    alertDiv.className = 'alert success';
                    alertDiv.textContent = \`✅ Profile collection link sent successfully to \${data.recipientEmail}!\`;
                    alertDiv.style.display = 'block';
                    this.reset();
                } else {
                    throw new Error(result.error || 'Failed to send email');
                }
                
            } catch (error) {
                alertDiv.className = 'alert error';
                alertDiv.textContent = \`❌ Error: \${error.message}\`;
                alertDiv.style.display = 'block';
            } finally {
                loadingDiv.style.display = 'none';
                sendBtn.disabled = false;
            }
        });
    </script>
</body>
</html>
    `);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
