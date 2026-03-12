const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const messageController = require('../controllers/messageController');
const { sendMessageValidator, fetchMessagesValidator } = require('../validators/messageValidator');

// Nouvelles routes pour la messagerie complète
router.post('/', protect, messageController.sendMessage);
router.get('/mentorship-conversations', protect, messageController.getMentorshipConversations);
router.get('/:userId', protect, messageController.getMessages);
router.post('/report', protect, messageController.reportMessage);
router.get('/', protect, messageController.getConversations);

// Anciennes routes pour compatibilité
router.post('/ajoute', protect, sendMessageValidator, messageController.sendMessage);
router.get('/conversation/:userId', protect, fetchMessagesValidator, messageController.getConversation);

module.exports = router;
