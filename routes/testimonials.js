const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  createTestimonial,
  getTestimonials,
  getMyTestimonials,
  updateTestimonial,
  deleteTestimonial
} = require('../controllers/testimonialController');

// Routes publiques
router.get('/', getTestimonials);

// Routes protégées
router.post('/', protect, createTestimonial);
router.get('/my', protect, getMyTestimonials);
router.put('/:testimonialId', protect, updateTestimonial);
router.delete('/:testimonialId', protect, deleteTestimonial);

module.exports = router;