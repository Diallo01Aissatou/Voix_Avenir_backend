const mongoose = require('mongoose');

const MentorRequestSchema = new mongoose.Schema({
  mentoree: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentore: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  response: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MentorRequest', MentorRequestSchema);