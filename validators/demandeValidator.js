const { body, validationResult } = require('express-validator');

// Validateur pour la création d'une demande
exports.createDemandeValidator = [
  body('mentor')
    .notEmpty()
    .withMessage('L\'ID de la mentore est requis')
    .isMongoId()
    .withMessage('ID de mentore invalide'),
  
  body('notes')
    .notEmpty()
    .withMessage('Le message est requis')
    .isLength({ min: 3, max: 500 })
    .withMessage('Le message doit contenir entre 3 et 500 caractères')
    .trim()
    .escape(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }
    next();
  }
];

// Validateur pour la réponse à une demande
exports.respondToRequestValidator = [
  body('status')
    .isIn(['accepted', 'rejected'])
    .withMessage('Le statut doit être "accepted" ou "rejected"'),
  
  body('responseMessage')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Le message de réponse ne peut pas dépasser 500 caractères')
    .trim()
    .escape(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }
    next();
  }
];
