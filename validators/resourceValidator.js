const Joi = require('joi');


exports.createResourceValidator =()=>{ Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().allow(''),
  file: Joi.string().allow(''),
  tags: Joi.array().items(Joi.string()).default([]),
  createdBy: Joi.string().hex().length(24).required(),
})};

exports.updateResourceValidator =()=>{ Joi.object({
  title: Joi.string().min(2).max(200),
  description: Joi.string().allow(''),
  file: Joi.string().allow(''),
  tags: Joi.array().items(Joi.string()),
})};
