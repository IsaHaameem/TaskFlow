const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  description: {
    type: String,
  },
  // The 'owner' field remains to signify the original creator/admin
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  // --- NEW: members field to store a list of users ---
  members: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    }
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Project', ProjectSchema);

