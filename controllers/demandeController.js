const Demande = require('../models/Demande');
const User = require('../models/User');

// Créer une nouvelle demande de mentorat
exports.createDemande = async (req, res) => {
  try {
    const { mentor, notes } = req.body;
    const mentoreeId = req.user._id;

    // Vérifier que l'utilisateur est une mentorée
    if (req.user.role !== 'mentoree') {
      return res.status(403).json({ 
        message: 'Seules les mentorées peuvent envoyer des demandes de mentorat' 
      });
    }

    // Vérifier que la mentore existe et est bien une mentore
    const mentore = await User.findById(mentor);
    if (!mentore || mentore.role !== 'mentore') {
      return res.status(404).json({ 
        message: 'Mentore non trouvée' 
      });
    }

    // Vérifier qu'il n'y a pas déjà une demande en cours
    const existingDemande = await Demande.findOne({
      mentoree: mentoreeId,
      mentore: mentor,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingDemande) {
      return res.status(400).json({ 
        message: 'Une demande est déjà en cours avec cette mentore' 
      });
    }

    // Créer la demande
    const demande = await Demande.create({
      mentoree: mentoreeId,
      mentore: mentor,
      message: notes
    });

    // Populer les informations des utilisateurs
    await demande.populate([
      { path: 'mentoree', select: 'name email photo city age level' },
      { path: 'mentore', select: 'name email photo profession expertise city' }
    ]);

    res.status(201).json(demande);
  } catch (error) {
    console.error('Erreur création demande:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
};

// Récupérer les demandes envoyées par la mentorée
exports.getMyRequests = async (req, res) => {
  try {
    const mentoreeId = req.user._id;

    const demandes = await Demande.find({ mentoree: mentoreeId })
      .populate('mentore', 'name photo profession expertise city')
      .sort({ createdAt: -1 });

    res.json(demandes);
  } catch (error) {
    console.error('Erreur récupération demandes:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
};

// Récupérer les demandes reçues par la mentore
exports.getReceivedRequests = async (req, res) => {
  try {
    const mentoreId = req.user._id;

    // Vérifier que l'utilisateur est une mentore
    if (req.user.role !== 'mentore') {
      return res.status(403).json({ 
        message: 'Seules les mentores peuvent voir les demandes reçues' 
      });
    }

    const demandes = await Demande.find({ mentore: mentoreId })
      .populate('mentoree', 'name photo city age level interests bio')
      .sort({ createdAt: -1 });

    res.json(demandes);
  } catch (error) {
    console.error('Erreur récupération demandes reçues:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
};

// Répondre à une demande (accepter ou refuser)
exports.respondToRequest = async (req, res) => {
  try {
    const { demandeId } = req.params;
    const { status, responseMessage } = req.body;
    const mentoreId = req.user._id;

    // Vérifier que l'utilisateur est une mentore
    if (req.user.role !== 'mentore') {
      return res.status(403).json({ 
        message: 'Seules les mentores peuvent répondre aux demandes' 
      });
    }

    // Vérifier que la demande existe et appartient à cette mentore
    const demande = await Demande.findOne({
      _id: demandeId,
      mentore: mentoreId,
      status: 'pending'
    });

    if (!demande) {
      return res.status(404).json({ 
        message: 'Demande non trouvée ou déjà traitée' 
      });
    }

    // Mettre à jour la demande
    demande.status = status;
    if (responseMessage) {
      demande.responseMessage = responseMessage;
    }
    demande.updatedAt = new Date();

    await demande.save();

    // Populer les informations pour la réponse
    await demande.populate([
      { path: 'mentoree', select: 'name email photo city age level' },
      { path: 'mentore', select: 'name email photo profession expertise city' }
    ]);

    res.json(demande);
  } catch (error) {
    console.error('Erreur réponse demande:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
};

// Récupérer les statistiques des demandes pour une mentorée
exports.getMyStats = async (req, res) => {
  try {
    const mentoreeId = req.user._id;

    const stats = await Demande.aggregate([
      { $match: { mentoree: mentoreeId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      activeMentorships: 0,
      pendingRequests: 0,
      completedSessions: 0,
      totalHours: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'accepted') {
        result.activeMentorships = stat.count;
      } else if (stat._id === 'pending') {
        result.pendingRequests = stat.count;
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur statistiques:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
};

// Récupérer les séances de mentorat pour une mentorée
exports.getMySessions = async (req, res) => {
  try {
    const mentoreeId = req.user._id;

    // Pour l'instant, retourner des données vides
    // Cette fonction sera étendue quand le système de séances sera implémenté
    res.json([]);
  } catch (error) {
    console.error('Erreur séances:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
};

// Récupérer les séances de mentorat pour une mentore
exports.getMySessionsAsMentore = async (req, res) => {
  try {
    const mentoreId = req.user._id;

    // Pour l'instant, retourner des données vides
    // Cette fonction sera étendue quand le système de séances sera implémenté
    res.json([]);
  } catch (error) {
    console.error('Erreur séances mentore:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
};

