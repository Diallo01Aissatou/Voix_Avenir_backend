const { body, param, validationResult } = require('express-validator');

const createRequestValidator = [
  body('mentoreId')
    .notEmpty()
    .withMessage('L\'ID de la mentore est requis')
    .isMongoId()
    .withMessage('ID de mentore invalide'),
  
  body('message')
    .notEmpty()
    .withMessage('Le message est requis')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Le message doit contenir entre 10 et 1000 caractères'),

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

const respondToRequestValidator = [
  param('requestId')
    .isMongoId()
    .withMessage('ID de demande invalide'),
  
  body('status')
    .isIn(['accepted', 'rejected'])
    .withMessage('Le statut doit être "accepted" ou "rejected"'),
  
  body('responseMessage')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Le message de réponse ne peut pas dépasser 500 caractères'),

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

module.exports = {
  createRequestValidator,
  respondToRequestValidator
};