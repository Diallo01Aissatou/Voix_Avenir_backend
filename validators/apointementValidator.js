const Joi = require('joi');

exports.createAppointmentValidator = ()=> {Joi.object({
  mentee: Joi.string().hex().length(24).required(), // injecté depuis req.user
  mentor: Joi.string().hex().length(24).required(),
  scheduledAt: Joi.date().required(),
  notes: Joi.string().allow(''),
  meetingLink: Joi.string().uri().allow(''),
})};

exports.updateStatusValidator =()=>{ Joi.object({
  status: Joi.string().valid('pending','accepted','refused','completed','cancelled').required(),
  meetingLink: Joi.string().uri().allow(''),
  notes: Joi.string().allow(''),
})};
