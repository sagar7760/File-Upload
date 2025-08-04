const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Connect to MongoDB if not already connected
if (!mongoose.connections[0].readyState) {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/profile-collection';
  mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

// Profile Schema
const profileSchema = new mongoose.Schema({
  profileId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    index: true
  },
  personalInfo: {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  professionalInfo: {
    currentPosition: {
      type: String,
      trim: true
    },
    companyName: {
      type: String,
      trim: true
    },
    companyStatus: {
      type: String,
      trim: true,
      enum: ['yes', 'no', '']
    },
    experience: {
      type: String,
      trim: true
    },
    skills: {
      type: String,
      trim: true
    }
  },
  additionalInfo: {
    education: {
      type: String,
      trim: true
    },
    achievements: {
      type: String,
      trim: true
    },
    goals: {
      type: String,
      trim: true
    }
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  emailSentTo: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  }
}, {
  timestamps: true
});

const Profile = mongoose.models.Profile || mongoose.model('Profile', profileSchema);

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
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, AMP-Email-Allow-Sender, AMP-Same-Origin'
  );
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('AMP-Access-Control-Allow-Source-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Expose-Headers', 'AMP-Access-Control-Allow-Source-Origin');

  console.log('📧 Profile update request received');
  console.log('📝 Method:', req.method);
  console.log('🌐 Origin:', req.headers.origin);
  console.log('🔗 User-Agent:', req.headers['user-agent']);

  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight handled');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    const body = await parseBody(req);
    console.log('📋 Form data received:', body);
    
    const { token, recipientEmail, fullName, companyStatus, newSkills, currentRole, companyName, experienceYears } = body;
    
    if (!token) {
      console.log('❌ Missing token');
      return res.status(400).json({ error: 'Submission token is required' });
    }
    
    if (!fullName) {
      console.log('❌ Missing full name');
      return res.status(400).json({ error: 'Full name is required' });
    }

    if (!companyStatus) {
      console.log('❌ Missing company status');
      return res.status(400).json({ error: 'Company status is required' });
    }

    console.log('✅ Basic validation passed');
    console.log('🎯 Processing profile for:', fullName);

    // Check if profile already exists for this token
    let profile = await Profile.findOne({ token });
    
    const profileData = {
      personalInfo: {
        fullName: fullName || '',
        email: recipientEmail || '',
        phone: '', // Can be added to the form later
        address: '' // Can be added to the form later
      },
      professionalInfo: {
        currentPosition: currentRole || '',
        experience: experienceYears ? `${experienceYears} years` : '',
        skills: newSkills || '',
        companyName: companyName || '',
        companyStatus: companyStatus || ''
      },
      additionalInfo: {
        education: '', // Can be added to the form later
        achievements: '', // Can be added to the form later
        goals: '' // Can be added to the form later
      },
      emailSentTo: recipientEmail || ''
    };
    
    if (profile) {
      // Update existing profile
      Object.assign(profile, profileData);
      await profile.save();
      console.log('✅ Updated existing profile for token:', token);
      console.log('📊 Updated profile ID:', profile.profileId);
    } else {
      // Create new profile
      profile = new Profile({
        profileId: uuidv4(),
        token,
        ...profileData
      });
      await profile.save();
      console.log('✅ Created new profile for token:', token);
      console.log('📊 New profile ID:', profile.profileId);
    }
    
    // Log the detailed profile data
    console.log('💾 Profile data saved to MongoDB:', {
      profileId: profile.profileId,
      fullName,
      companyStatus,
      currentRole,
      companyName,
      experienceYears,
      newSkills: newSkills ? newSkills.substring(0, 50) + '...' : 'None'
    });
    
    // Return success response optimized for AMP form
    const successResponse = {
      success: true,
      message: 'Profile information submitted successfully! ✅',
      profileId: profile.profileId,
      timestamp: new Date(profile.submittedAt).toLocaleString(),
      data: {
        fullName,
        companyStatus,
        currentRole: currentRole || 'Not specified',
        company: companyName || 'Not specified'
      }
    };
    
    console.log('📤 Sending success response:', successResponse);
    res.json(successResponse);
    
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    console.error('📋 Error details:', error.message);
    console.error('🔍 Stack trace:', error.stack);
    
    // Return error response optimized for AMP form
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit profile information. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
