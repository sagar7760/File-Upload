module.exports = (req, res) => {
  // Extract token from URL
  const token = req.url.split('/').pop().split('?')[0];
  
  if (req.method === 'GET') {
    // Serve upload page
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Upload</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
            max-width: 600px;
            width: 100%;
        }
        h1 { text-align: center; color: #333; margin-bottom: 30px; font-size: 2rem; }
        .warning {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .upload-area {
            border: 3px dashed #ddd;
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
            margin-bottom: 20px;
        }
        .upload-area:hover { border-color: #667eea; background-color: #f8f9ff; }
        .upload-icon { font-size: 3rem; color: #667eea; margin-bottom: 15px; }
        .upload-text { color: #666; font-size: 18px; margin-bottom: 10px; }
        .upload-subtext { color: #999; font-size: 14px; }
        #fileInput { display: none; }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            margin-top: 20px;
        }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .alert {
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        .alert.success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert.error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📁 Upload Your Files</h1>
        
        <div class="warning">
            <strong>⚠️ Vercel Limitation:</strong> This demo runs on Vercel which doesn't support persistent file storage. Files will be processed but not permanently stored.
        </div>
        
        <div id="alert" class="alert"></div>
        
        <div class="info">
            <strong>Upload Guidelines:</strong>
            <ul style="margin-top: 10px; margin-left: 20px;">
                <li>Accepted formats: PDF, DOC, DOCX, TXT, RTF</li>
                <li>Maximum file size: 10MB per file</li>
                <li>This is a demo - files are processed but not stored permanently</li>
            </ul>
        </div>
        
        <div class="upload-area" id="uploadArea">
            <div class="upload-icon">📎</div>
            <div class="upload-text">Click to select files or drag and drop</div>
            <div class="upload-subtext">PDF, DOC, DOCX, TXT, RTF files only</div>
        </div>
        
        <input type="file" id="fileInput" multiple accept=".pdf,.doc,.docx,.txt,.rtf">
        <button class="btn" id="uploadBtn" disabled>Select Files to Upload</button>
    </div>

    <script>
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');
        const alertDiv = document.getElementById('alert');
        
        let selectedFiles = [];
        
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileSelect);
        
        function handleFileSelect(e) {
            selectedFiles = Array.from(e.target.files);
            updateUploadButton();
        }
        
        function updateUploadButton() {
            uploadBtn.disabled = selectedFiles.length === 0;
            uploadBtn.textContent = selectedFiles.length === 0 ? 'Select Files to Upload' : \`Upload \${selectedFiles.length} File\${selectedFiles.length > 1 ? 's' : ''}\`;
        }
        
        function showAlert(type, message) {
            alertDiv.className = \`alert \${type}\`;
            alertDiv.textContent = message;
            alertDiv.style.display = 'block';
            setTimeout(() => alertDiv.style.display = 'none', 5000);
        }
        
        uploadBtn.addEventListener('click', () => {
            if (selectedFiles.length === 0) return;
            
            // Simulate upload process
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Processing...';
            
            setTimeout(() => {
                showAlert('success', \`✅ \${selectedFiles.length} file(s) processed successfully! (Demo mode - files not permanently stored)\`);
                selectedFiles = [];
                fileInput.value = '';
                updateUploadButton();
            }, 2000);
        });
    </script>
</body>
</html>
    `);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
