const User = require('../models/User');
const Appointment = require('../models/Appointement');
const Resource = require('../models/Resource');

// Obtenir les statistiques pour le dashboard admin
exports.getAdminStats = async (req, res) => {
  try {
    // Compter les utilisateurs par rôle
    const totalUsers = await User.countDocuments();
    const totalMentores = await User.countDocuments({ role: 'mentore' });
    const approvedMentores = await User.countDocuments({ role: 'mentore', isApproved: true });
    const totalMentorees = await User.countDocuments({ role: 'mentoree' });
    
    // Compter les demandes par statut
    const totalRequests = await Appointment.countDocuments();
    const pendingRequests = await Appointment.countDocuments({ status: 'pending' });
    const acceptedRequests = await Appointment.countDocuments({ status: 'accepted' });
    
    const stats = {
      totalUsers,
      totalMentores,
      approvedMentores,
      totalMentorees,
      totalRequests,
      pendingRequests,
      acceptedRequests
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Erreur statistiques admin:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Nettoyer les ressources cassées de l'ancien système de stockage local
exports.cleanupBrokenResources = async (req, res) => {
  try {
    // Trouver toutes les ressources dont le lien commence par "/uploads/" ou ne correspond pas au format GridFS/HTTP
    const filter = {
      $and: [
        { fileUrl: { $exists: true, $ne: '' } },
        { fileUrl: { $not: /^\/api\/files\// } },
        { fileUrl: { $not: /^\/serve-file\// } },
        { fileUrl: { $not: /^http/ } }
      ]
    };
    
    const brokenResources = await Resource.find(filter);
    
    if (brokenResources.length === 0) {
      return res.json({ message: 'Aucune ressource cassée n\'a été trouvée.', count: 0 });
    }

    const result = await Resource.deleteMany(filter);
    
    res.json({ 
      message: `${result.deletedCount} ressources fantômes de l'ancien système ont été supprimées avec succès.`, 
      count: result.deletedCount 
    });
  } catch (error) {
    console.error('Erreur nettoyage ressources:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};