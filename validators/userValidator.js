const Joi = require('joi');

const baseUser = {
  role: Joi.string().valid('mentoree', 'mentore', 'admin'),
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  age: Joi.number().integer().min(10).max(120),
  city: Joi.string().max(120).allow(''),
  level: Joi.string().max(120).allow(''),
  interests: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).default([]),
  profession: Joi.string().allow(''),
  organization: Joi.string().allow(''),
  expertise: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).default([]),
  bio: Joi.string().allow(''),
  documents: Joi.array().items(Joi.string()).default([]),
  availability: Joi.array().items(Joi.object({ date: Joi.date(), notes: Joi.string().allow('') })),
  verified: Joi.boolean(),
};

exports.updateMeValidator = (req, res, next) => {
  const schema = Joi.object({
    ...baseUser,
    password: Joi.string().min(6).optional(),
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: "Validation échouée",
      errors: error.details.map((err) => err.message),
    });
  }

  req.body = value;
  next();
};



exports.adminCreateUserValidator = (req, res, next) => {
  try {
    // Définition du schéma Joi
    const schema = Joi.object({
      ...baseUser,
      role: baseUser.role.required(),
      name: baseUser.name.required(),
      email: baseUser.email.required(),
      password: Joi.string()
        .min(6)
        .required()
        .messages({
          "string.min": "Le mot de passe doit contenir au moins 6 caractères.",
          "any.required": "Le mot de passe est obligatoire.",
        }),
      verified: Joi.boolean().default(false),
    });

    // Validation du body de la requête
    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      return res.status(400).json({
        message: "Validation échouée",
        errors: error.details.map((err) => err.message),
      });
    }

    req.body = value; // données validées
    next();
  } catch (err) {
    res.status(500).json({ message: "Erreur interne du serveur", error: err });
  }
};

// exports.adminUpdateUserValidator = Joi.object({
//   ...baseUser,
//   password: Joi.string().min(6).optional(),
// });
