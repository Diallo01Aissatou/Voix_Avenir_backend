const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Route for chat with AI
router.post('/chat', aiController.chat);

module.exports = router;
