const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  email: {
    type: String,
    required: [true, "L'email est requis"],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez entrer un email valide']
  },
  subject: {
    type: String,
    required: [true, 'Le sujet est requis'],
    enum: ['orientation', 'mentorat', 'partenariat', 'technique', 'autre']
  },
  message: {
    type: String,
    required: [true, 'Le message est requis'],
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'resolved'],
    default: 'new'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);
