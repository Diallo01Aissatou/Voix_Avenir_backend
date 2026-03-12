const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  createRequest,
  getReceivedRequests,
  getSentRequests,
  respondToRequest,
  getActiveMentorships,
  getMentorshipStats,
  endMentorship,
  getSessions,
  confirmSession,
  cancelSession,
  getNotifications,
  updateSessionLink,
  updateSession,
  completeSession
} = require('../controllers/mentorshipController');

// Routes pour les demandes de mentorat
router.post('/request', protect, createRequest);
router.get('/received', protect, getReceivedRequests);
router.get('/sent', protect, getSentRequests);
router.put('/respond/:requestId', protect, respondToRequest);
router.get('/active', protect, getActiveMentorships);
router.get('/stats', protect, getMentorshipStats);
router.get('/sessions', protect, getSessions);
router.get('/notifications', protect, getNotifications);
router.put('/sessions/:sessionId/confirm', protect, confirmSession);
router.put('/sessions/:sessionId/cancel', protect, cancelSession);
router.put('/sessions/:sessionId/link', protect, updateSessionLink);
router.put('/sessions/:sessionId/update', protect, updateSession);
router.put('/sessions/:sessionId/complete', protect, completeSession);
router.put('/end/:requestId', protect, endMentorship);

module.exports = router;