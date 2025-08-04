const mongoose = require('mongoose');

/**
 * Profile Schema for MongoDB
 */
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
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    }
  },
  professionalInfo: {
    currentPosition: {
      type: String,
      trim: true,
      default: ''
    },
    experience: {
      type: String,
      trim: true,
      default: ''
    },
    skills: {
      type: String,
      trim: true,
      default: ''
    }
  },
  additionalInfo: {
    education: {
      type: String,
      trim: true,
      default: ''
    },
    achievements: {
      type: String,
      trim: true,
      default: ''
    },
    goals: {
      type: String,
      trim: true,
      default: ''
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

// Index for efficient queries
profileSchema.index({ token: 1, submittedAt: -1 });
profileSchema.index({ emailSentTo: 1, submittedAt: -1 });

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
