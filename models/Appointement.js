const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestedAt: { type: Date, default: Date.now },
  scheduledAt: Date,
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'], 
    default: 'pending' 
  }
,
  notes: String,
  meetingLink: String // optional (Zoom/Meet link)
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
; 