const Joi = require('joi');

const applicationSchema = Joi.object({
  fullName: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(6).max(20).required(),
  position: Joi.string().required(),
  cvUrl: Joi.string().uri().optional(),
  coverLetter: Joi.string().optional().allow(''),
});

module.exports = { applicationSchema };
