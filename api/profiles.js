const mongoose = require('mongoose');

// Connect to MongoDB if not already connected
if (!mongoose.connections[0].readyState) {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/profile-collection';
  mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

// Profile Schema (same as in update-profile.js)
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

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all profiles from MongoDB
    const profiles = await Profile.find({})
      .sort({ submittedAt: -1 }) // Most recent first
      .lean(); // Return plain JavaScript objects
    
    res.json({
      success: true,
      count: profiles.length,
      profiles: profiles
    });
  } catch (error) {
    console.error('Error reading profiles:', error);
    res.status(500).json({ error: 'Failed to load profiles' });
  }
};
