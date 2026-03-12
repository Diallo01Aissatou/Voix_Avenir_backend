const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  position: { type: String, required: true, trim: true },
  cvUrl: { type: String, trim: true },
  coverLetter: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Oportinites', applicationSchema);
