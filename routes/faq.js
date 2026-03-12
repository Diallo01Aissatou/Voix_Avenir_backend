const express = require('express');
const router = express.Router();
const { getFAQs, createFAQ } = require('../controllers/faqController');

// Route publique pour obtenir les FAQs
router.get('/', getFAQs);

// Route pour ajouter une FAQ (pourrait être protégée plus tard)
router.post('/', createFAQ);

module.exports = router;
