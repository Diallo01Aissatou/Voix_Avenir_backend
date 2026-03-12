const mongoose = require('mongoose');

const DemandeSchema = new mongoose.Schema({
  mentoree: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  mentore: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected'], 
    default: 'pending' 
  },
  responseMessage: { 
    type: String, 
    default: '' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index pour optimiser les requêtes
DemandeSchema.index({ mentoree: 1, mentore: 1 });
DemandeSchema.index({ status: 1 });

// Middleware pour mettre à jour updatedAt
DemandeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Demande', DemandeSchema);

