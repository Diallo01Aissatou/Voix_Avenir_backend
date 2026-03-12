const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const News = require('../models/News');
const { protect, authorize } = require('../middlewares/auth');

// Configuration multer pour les images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/news/');
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

// Obtenir toutes les actualités actives
router.get('/', async (req, res) => {
  try {
    const news = await News.find({ isActive: true })
      .sort('-createdAt')
      .limit(10);
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Ajouter une actualité (admin seulement)
router.post('/', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    const newsData = {
      title: req.body.title,
      summary: req.body.summary,
      content: req.body.content,
      isActive: true
    };
    
    if (req.file) {
      newsData.image = '/uploads/news/' + req.file.filename;
    }
    
    const news = await News.create(newsData);
    res.status(201).json(news);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Supprimer une actualité (admin seulement)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    res.json({ message: 'Actualité supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;