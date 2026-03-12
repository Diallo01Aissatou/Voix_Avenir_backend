const Joi = require('joi');

exports.sendMessageValidator =()=>{ Joi.object({
  from: Joi.string().hex().length(24).required(), // injecté depuis req.user
  to: Joi.string().hex().length(24).when('room', { is: Joi.exist(), then: Joi.forbidden(), otherwise: Joi.required() }),
  text: Joi.string().allow(''),
  attachments: Joi.array().items(Joi.string()).default([]),
  room: Joi.string().allow(''),
})};

exports.fetchMessagesValidator =()=>{ Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
})};
