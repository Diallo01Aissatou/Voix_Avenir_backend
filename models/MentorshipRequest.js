const mongoose = require('mongoose');

const MentorshipRequestSchema = new mongoose.Schema({
  mentoree: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentore: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  response: String,
  responseMessage: String, // Message de réponse de la mentore
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // Champs pour le suivi
  isActive: { type: Boolean, default: true },
  startDate: Date, // Date de début du mentorat
  endDate: Date, // Date de fin du mentorat
  notes: String, // Notes additionnelles
  // Champs pour les séances
  sessionTopic: String,
  sessionScheduledDate: Date,
  sessionTime: String,
  sessionDuration: Number,
  sessionMode: String,
  sessionStatus: String,
  sessionMeetingLink: String,
  confirmedAt: Date,
  cancelledAt: Date,
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedAt: Date
});

// Index pour optimiser les requêtes
MentorshipRequestSchema.index({ mentoree: 1, status: 1 });
MentorshipRequestSchema.index({ mentore: 1, status: 1 });
MentorshipRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('MentorshipRequest', MentorshipRequestSchema);