const User = require('../models/User');
const Appointment = require('../models/Appointement');

// Obtenir les statistiques pour le dashboard admin
exports.getAdminStats = async (req, res) => {
  try {
    // Compter les utilisateurs par rôle
    const totalUsers = await User.countDocuments();
    const totalMentores = await User.countDocuments({ role: 'mentore' });
    const totalMentorees = await User.countDocuments({ role: 'mentoree' });
    
    // Compter les demandes par statut
    const totalRequests = await Appointment.countDocuments();
    const pendingRequests = await Appointment.countDocuments({ status: 'pending' });
    const acceptedRequests = await Appointment.countDocuments({ status: 'accepted' });
    
    const stats = {
      totalUsers,
      totalMentores,
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