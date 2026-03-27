const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  role: { type: String, enum: ['mentoree','mentore','admin'], required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { return !this.googleId && !this.facebookId && !this.linkedinId; } },
  googleId: String,
  facebookId: String,
  linkedinId: String,
  age: Number,
  photo: String,
  city: String,
  level: String, 
  interests: [String],
  profession: String, 
  organization: String,
  expertise: [String], 
  bio: String,
  verified: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  isMasterAdmin: { type: Boolean, default: false }, 
  documents: [String], 
  availability: [ 
    {
      date: Date,
      notes: String
    }
  ],
  // Champs de disponibilité pour les mentores
  availableDays: [String],
  startTime: String,
  endTime: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  //  champs pour reset password
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

//  Méthode pour générer un token reset
UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // expire dans 10 min

  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
