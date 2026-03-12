const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const { protect } = require('../middlewares/auth');

// Ajouter une évaluation
router.post('/', protect, async (req, res) => {
  try {
    const { mentor, rating, comment } = req.body;
    
    // Vérifier si l'utilisateur a déjà évalué ce mentor
    const existingRating = await Rating.findOne({
      mentee: req.user._id,
      mentor
    });
    
    if (existingRating) {
      // Mettre à jour l'évaluation existante
      existingRating.rating = rating;
      existingRating.comment = comment;
      await existingRating.save();
      res.json(existingRating);
    } else {
      // Créer une nouvelle évaluation
      const newRating = await Rating.create({
        mentee: req.user._id,
        mentor,
        rating,
        comment
      });
      res.status(201).json(newRating);
    }
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Obtenir les évaluations d'un mentor
router.get('/mentor/:mentorId', async (req, res) => {
  try {
    const ratings = await Rating.find({ mentor: req.params.mentorId })
      .populate('mentee', 'name')
      .sort('-createdAt');
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;