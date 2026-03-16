const Testimonial = require('../models/Testimonial');

// Créer un témoignage (seulement pour les mentorées)
exports.createTestimonial = async (req, res) => {
  try {
    const { content, rating } = req.body;
    const userId = req.user._id;

    // Vérifier que l'utilisateur est une mentorée
    if (req.user.role !== 'mentoree') {
      return res.status(403).json({ message: 'Seules les mentorées peuvent créer des témoignages' });
    }

    const testimonial = new Testimonial({
      author: userId,
      content,
      rating
    });

    await testimonial.save();

    const populatedTestimonial = await Testimonial.findById(testimonial._id)
      .populate('author', 'name photo profession');

    res.status(201).json(populatedTestimonial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir tous les témoignages des mentorées (pour la page d'accueil)
exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isPublished: true })
      .populate({
        path: 'author',
        select: 'name photo profession role',
        match: { role: 'mentoree' } // Filtrer seulement les mentorées
      })
      .sort({ createdAt: -1 })
      .limit(10);

    // Filtrer les témoignages où l'auteur est null (pas une mentorée)
    const mentoreesTestimonials = testimonials.filter(testimonial => testimonial.author !== null);

    // Formater les URLs des photos
    const testimonialsWithPhotoUrl = mentoreesTestimonials.map(testimonial => {
      const testimonialObj = testimonial.toObject();
      if (testimonialObj.author?.photo && !testimonialObj.author.photo.startsWith('http')) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        testimonialObj.author.photo = `${baseUrl}/uploads/${testimonialObj.author.photo.split('/').pop()}`;
      }
      return testimonialObj;
    });

    res.json(testimonialsWithPhotoUrl);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtenir mes témoignages (seulement pour les mentorées)
exports.getMyTestimonials = async (req, res) => {
  try {
    const userId = req.user._id;

    // Vérifier que l'utilisateur est une mentorée
    if (req.user.role !== 'mentoree') {
      return res.status(403).json({ message: 'Seules les mentorées peuvent voir leurs témoignages' });
    }

    const testimonials = await Testimonial.find({ author: userId })
      .populate('author', 'name photo profession')
      .sort({ createdAt: -1 });

    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Modifier un témoignage (seulement pour les mentorées)
exports.updateTestimonial = async (req, res) => {
  try {
    const { testimonialId } = req.params;
    const { content, rating } = req.body;
    const userId = req.user._id;

    // Vérifier que l'utilisateur est une mentorée
    if (req.user.role !== 'mentoree') {
      return res.status(403).json({ message: 'Seules les mentorées peuvent modifier leurs témoignages' });
    }

    const testimonial = await Testimonial.findById(testimonialId);
    if (!testimonial) {
      return res.status(404).json({ message: 'Témoignage non trouvé' });
    }

    if (testimonial.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    testimonial.content = content;
    testimonial.rating = rating;
    await testimonial.save();

    const populatedTestimonial = await Testimonial.findById(testimonial._id)
      .populate('author', 'name photo profession');

    res.json(populatedTestimonial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un témoignage (seulement pour les mentorées)
exports.deleteTestimonial = async (req, res) => {
  try {
    const { testimonialId } = req.params;
    const userId = req.user._id;

    // Vérifier que l'utilisateur est une mentorée
    if (req.user.role !== 'mentoree') {
      return res.status(403).json({ message: 'Seules les mentorées peuvent supprimer leurs témoignages' });
    }

    const testimonial = await Testimonial.findById(testimonialId);
    if (!testimonial) {
      return res.status(404).json({ message: 'Témoignage non trouvé' });
    }

    if (testimonial.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await Testimonial.findByIdAndDelete(testimonialId);
    res.json({ message: 'Témoignage supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};