const Expert = require('../models/Expert');

// Obtenir toutes les expertes actives
exports.getExperts = async (req, res) => {
  try {
    const experts = await Expert.find({ isActive: true })
      .populate('user', 'name email phone profession city photo bio')
      .sort('-createdAt');
    res.json(experts);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Créer une nouvelle experte (admin)
exports.createExpert = async (req, res) => {
  try {
    const { userId, domain, achievements, quote } = req.body;
    
    // Vérifier si cette mentore n'est pas déjà experte
    const existingExpert = await Expert.findOne({ user: userId });
    if (existingExpert) {
      return res.status(400).json({ message: 'Cette mentore est déjà une experte' });
    }
    
    const expert = await Expert.create({
      user: userId,
      domain,
      achievements: Array.isArray(achievements) ? achievements : [achievements].filter(Boolean),
      quote
    });
    
    const populatedExpert = await Expert.findById(expert._id).populate('user');
    res.status(201).json({ message: 'Experte ajoutée avec succès', expert: populatedExpert });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir toutes les expertes (admin)
exports.getAllExperts = async (req, res) => {
  try {
    const experts = await Expert.find()
      .populate('user', 'name email phone profession city photo bio')
      .sort('-createdAt');
    res.json(experts);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir toutes les mentores disponibles (admin)
exports.getAvailableMentores = async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Récupérer les IDs des mentores déjà expertes
    const existingExperts = await Expert.find({}, 'user');
    const expertUserIds = existingExperts.map(expert => expert.user);
    
    // Récupérer les mentores qui ne sont pas encore expertes
    const availableMentores = await User.find({
      role: 'mentore',
      _id: { $nin: expertUserIds }
    }).select('name email profession city photo bio');
    
    res.json(availableMentores);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer une experte (admin)
exports.deleteExpert = async (req, res) => {
  try {
    const { id } = req.params;
    await Expert.findByIdAndDelete(id);
    res.json({ message: 'Experte supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Mettre à jour le statut vedette (admin)
exports.toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Retirer le statut vedette de toutes les autres
    await Expert.updateMany({}, { isFeatured: false });
    
    // Définir cette experte comme vedette
    const expert = await Expert.findByIdAndUpdate(
      id,
      { isFeatured: true },
      { new: true }
    );
    
    res.json({ message: 'Experte définie comme vedette', expert });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};