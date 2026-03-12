const express = require('express');
const router = express.Router();
const { submitQuestion, getQuestions } = require('../controllers/questionController');

// Route publique pour soumettre une question
router.post('/', submitQuestion);

// Route pour l'admin (pourrait être protégée plus tard)
router.get('/', getQuestions);

module.exports = router;
