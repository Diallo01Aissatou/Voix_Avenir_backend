const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  mentore: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentoree: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentorshipRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorshipRequest', required: true },
  topic: { type: String, required: true },
  description: String,
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },
  duration: { type: Number, default: 60 },
  mode: { type: String, enum: ['online', 'video', 'presential'], default: 'online' },
  status: { type: String, enum: ['scheduled', 'confirmed', 'completed', 'cancelled'], default: 'scheduled' },
  meetingLink: String,
  resources: [String],
  notes: String,
  confirmedAt: Date,
  cancelledAt: Date,
  completedAt: Date,
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Session', SessionSchema);