const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    enum: ['session_created', 'session_updated', 'session_confirmed', 'session_cancelled', 'session_reminder', 'request_accepted', 'request_rejected'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorshipRequest' },
  read: { type: Boolean, default: false },
  readAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);