const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middlewares/auth');
const expertController = require('../controllers/expertController');

// Configuration multer pour les photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, 'expert-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'), false);
    }
  }
});

// Routes publiques
router.get('/', expertController.getExperts);

// Routes admin
router.get('/all', protect, authorize('admin'), expertController.getAllExperts);
router.get('/available-mentores', protect, authorize('admin'), expertController.getAvailableMentores);
router.post('/', protect, authorize('admin'), expertController.createExpert);
router.delete('/:id', protect, authorize('admin'), expertController.deleteExpert);
router.put('/featured/:id', protect, authorize('admin'), expertController.toggleFeatured);

module.exports = router;