const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true,
  },
  // We'll add fields for voice messages later
  // isVoiceMessage: { type: Boolean, default: false },
  // voiceMessageUrl: { type: String },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Message', MessageSchema);
