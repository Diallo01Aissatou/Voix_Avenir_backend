const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const demandeController = require('../controllers/demandeController');
const { createDemandeValidator, respondToRequestValidator } = require('../validators/demandeValidator');

// Routes pour les mentorées
router.post('/', protect, createDemandeValidator, demandeController.createDemande);
router.get('/my-requests', protect, demandeController.getMyRequests);
router.get('/my-stats', protect, demandeController.getMyStats);
router.get('/my-sessions', protect, demandeController.getMySessions);

// Routes pour les mentores
router.get('/received-requests', protect, demandeController.getReceivedRequests);
router.put('/:demandeId', protect, respondToRequestValidator, demandeController.respondToRequest);
router.get('/my-sessions', protect, demandeController.getMySessionsAsMentore);

module.exports = router;
