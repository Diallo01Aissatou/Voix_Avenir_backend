const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Event = require('../models/Event');
const { protect, authorize } = require('../middlewares/auth');
const { uploadToGridFS, deleteFromGridFS } = require('../utils/gridfsUtils');

// Configuration multer pour les images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/events/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

// Obtenir tous les événements actifs
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ isActive: true })
      .sort('date')
      .limit(10);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Ajouter un événement (admin seulement)
router.post('/', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    const eventData = {
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      location: req.body.location,
      isActive: true
    };
    
    if (req.file) {
      eventData.image = await uploadToGridFS(req.file.path, `event-${Date.now()}-${req.file.originalname}`, req.file.mimetype);
    }
    
    const event = await Event.create(eventData);
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Supprimer un événement (admin seulement)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (event && event.image && event.image.startsWith('/api/files/')) {
      await deleteFromGridFS(event.image);
    }
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Événement supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;