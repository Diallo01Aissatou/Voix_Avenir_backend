const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileType: {
    type: String
  },
  messageType: {
    type: String,
    enum: ['text', 'file'],
    default: 'text'
  },
  mentorshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MentorshipRequest'
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportReason: String,
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);