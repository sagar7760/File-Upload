const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Local storage file for profile data
const dataDir = path.join(process.cwd(), 'data');
const profileDataFile = path.join(dataDir, 'profiles.json');

// Ensure data directory and file exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(profileDataFile)) {
  fs.writeJsonSync(profileDataFile, []);
}

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
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
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
    const { uploadToken, recipientEmail, fullName, companyStatus, newSkills, currentRole, companyName, experienceYears } = body;
    
    if (!uploadToken) {
      return res.status(400).json({ error: 'Submission token is required' });
    }
    
    if (!fullName) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    
    if (!companyStatus) {
      return res.status(400).json({ error: 'Company status is required' });
    }

    // Create profile data object
    const profileData = {
      id: uuidv4(),
      uploadToken,
      recipientEmail,
      fullName,
      companyStatus,
      newSkills,
      currentRole,
      companyName,
      experienceYears: experienceYears ? parseInt(experienceYears) : null,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Read existing profiles
    let profiles = [];
    try {
      profiles = fs.readJsonSync(profileDataFile);
    } catch (error) {
      console.log('No existing profiles file, creating new one');
      profiles = [];
    }
    
    // Check if profile already exists for this token
    const existingProfileIndex = profiles.findIndex(p => p.uploadToken === uploadToken);
    
    if (existingProfileIndex !== -1) {
      // Update existing profile
      profiles[existingProfileIndex] = {
        ...profiles[existingProfileIndex],
        ...profileData,
        updatedAt: new Date().toISOString()
      };
      console.log('Updated existing profile for token:', uploadToken);
    } else {
      // Add new profile
      profiles.push(profileData);
      console.log('Added new profile for token:', uploadToken);
    }
    
    // Save to local JSON file
    fs.writeJsonSync(profileDataFile, profiles, { spaces: 2 });
    
    // Log the profile update
    console.log('Profile data saved locally:', {
      id: profileData.id,
      fullName,
      companyStatus,
      currentRole,
      companyName
    });
    
    // Return success response for AMP form
    res.json({
      success: true,
      message: 'Profile information submitted successfully',
      profileId: profileData.id,
      timestamp: profileData.submittedAt
    });
    
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to submit profile information' });
  }
};
