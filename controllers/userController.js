const User = require('../models/User');
const path = require('path');

// Obtenir toutes les mentores (public)
exports.getMentores = async (req, res) => {
  try {
    const { city, expertise, search, role } = req.query;
    console.log('Paramètres reçus:', { city, expertise, search, role });

    const filter = {};

    // Filtrer par rôle si spécifié
    if (role) filter.role = role;

    // Seuls les mentors approuvés sont visibles publiquement
    if (!role || role === 'mentore') {
      filter.isApproved = true;
    }

    if (city) filter.city = city;
    if (expertise) filter.expertise = { $in: [expertise] };
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { profession: new RegExp(search, 'i') }
      ];
    }

    console.log('Filtre MongoDB:', filter);

    const users = await User.find(filter)
      .select('name profession city expertise bio photo role availableDays startTime endTime')
      .sort({ createdAt: -1 });

    // Ajouter l'URL complète pour les photos
    const usersWithPhotoUrl = users.map(user => {
      const userObj = user.toObject();
      if (userObj.photo && !userObj.photo.startsWith('http') && !userObj.photo.startsWith('data:')) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const fileName = userObj.photo.split('/').pop();
        userObj.photo = `${baseUrl}/uploads/${fileName}`;
      }
      return userObj;
    });

    console.log(`${usersWithPhotoUrl.length} utilisateurs trouvés`);
    res.json(usersWithPhotoUrl);
  } catch (error) {
    console.error('Erreur getMentores:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir la liste des villes
exports.getCities = async (req, res) => {
  try {
    const cities = await User.distinct('city', { 
      role: 'mentore', 
      isApproved: true, 
      city: { $ne: null, $ne: '' } 
    });
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir la liste des expertises
exports.getExpertise = async (req, res) => {
  try {
    const expertises = await User.aggregate([
      { $match: { role: 'mentore', isApproved: true, expertise: { $exists: true, $ne: [] } } },
      { $unwind: '$expertise' },
      { $group: { _id: '$expertise' } },
      { $sort: { _id: 1 } }
    ]);
    const expertiseList = expertises.map(e => e._id);
    res.json(expertiseList);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir le profil de l'utilisateur connecté
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    // Ajouter l'URL complète pour la photo
    const userObj = user.toObject();
    if (userObj.photo && !userObj.photo.startsWith('http') && !userObj.photo.startsWith('data:')) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      userObj.photo = `${baseUrl}/uploads/${userObj.photo.split('/').pop()}`;
    }

    res.json(userObj);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Mettre à jour le profil de l'utilisateur connecté
exports.updateMyProfile = async (req, res) => {
  try {
    const { 
      name, 
      age, 
      city, 
      level, 
      profession, 
      interests, 
      expertise, 
      bio, 
      photo,
      availableDays, 
      startTime, 
      endTime 
    } = req.body;

    const updateData = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (age !== undefined) updateData.age = age;
    if (city !== undefined) updateData.city = city;
    if (level !== undefined) updateData.level = level;
    if (profession !== undefined) updateData.profession = profession;
    if (bio !== undefined) updateData.bio = bio;
    if (photo !== undefined) updateData.photo = photo; // Support pour Base64 permanent
    if (availableDays !== undefined) updateData.availableDays = availableDays;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;

    // Traitement des tableaux (interests et expertise)
    const parseToArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') return val.split(',').map(v => v.trim()).filter(Boolean);
      return [];
    };

    if (interests !== undefined) updateData.interests = parseToArray(interests);
    if (expertise !== undefined) updateData.expertise = parseToArray(expertise);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    // Ajouter l'URL complète pour la photo
    const userObj = user.toObject();
    if (userObj.photo && !userObj.photo.startsWith('http') && !userObj.photo.startsWith('data:')) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      userObj.photo = `${baseUrl}/uploads/${userObj.photo.split('/').pop()}`;
    }

    res.json({ success: true, message: 'Profil mis à jour', user: userObj });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Méthodes admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    const usersWithPhotoUrl = users.map(user => {
      const userObj = user.toObject();
      if (userObj.photo && !userObj.photo.startsWith('http') && !userObj.photo.startsWith('data:')) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const fileName = userObj.photo.split('/').pop();
        userObj.photo = `${baseUrl}/uploads/${fileName}`;
      }
      return userObj;
    });

    res.json({ users: usersWithPhotoUrl, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir les statistiques de la plateforme (public)
exports.getPublicStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMentores = await User.countDocuments({ role: 'mentore', isApproved: true });
    const totalMentorees = await User.countDocuments({ role: 'mentoree' });

    const citiesCount = await User.distinct('city').then(cities =>
      cities.filter(city => city && city.trim() !== '').length
    );

    let partnershipsCount = 0;
    try {
      const Partner = require('../models/Partner');
      partnershipsCount = await Partner.countDocuments({ isActive: true });
    } catch (e) {
      partnershipsCount = 0;
    }

    // Calculer le taux de satisfaction basé sur le nombre d'utilisateurs
    const satisfactionRate = totalUsers > 0
      ? Math.min(95 + Math.floor(totalUsers / 10), 100)
      : 98;

    res.json({
      totalUsers,
      totalMentores,
      totalMentorees,
      citiesCovered: citiesCount,
      partnerships: partnershipsCount,
      satisfactionRate
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir les statistiques de la plateforme (admin)
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMentores = await User.countDocuments({ role: 'mentore' }); // Total mentores (incluant non-approuvés)
    const approvedMentores = await User.countDocuments({ role: 'mentore', isApproved: true });
    const totalMentorees = await User.countDocuments({ role: 'mentoree' });

    let totalRequests = 0;
    let pendingRequests = 0;
    let acceptedRequests = 0;
    try {
      const Appointment = require('../models/Appointement');
      totalRequests = await Appointment.countDocuments();
      pendingRequests = await Appointment.countDocuments({ status: 'pending' });
      acceptedRequests = await Appointment.countDocuments({ status: 'accepted' });
    } catch (e) { 
      console.error('Erreur comptage rendez-vous:', e.message);
    }

    res.json({ 
      totalUsers, 
      totalMentores, 
      approvedMentores, 
      totalMentorees, 
      totalRequests, 
      pendingRequests, 
      acceptedRequests 
    });
  } catch (error) {
    console.error('Erreur getStats:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.searchMentors = async (req, res) => {
  try {
    const { q, city, expertise, page = 1, limit = 10 } = req.query;

    // 🔹 filtre de base = mentors approuvés
    const filter = { isApproved: true };

    // 🔹 si on veut chercher avec q (nom ou profession)
    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { profession: new RegExp(q, "i") }
      ];
    }

    // 🔹 filtre par ville
    if (city) filter.city = city;

    // 🔹 filtre par expertise
    if (expertise) filter.expertise = expertise;

    // 🔹 pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select("-password -documents -resetPasswordToken -resetPasswordExpire") // on cache les champs sensibles
      .skip(skip)
      .limit(parseInt(limit));

    // Ajouter l'URL complète pour les photos
    const usersWithPhotoUrl = users.map(user => {
      const userObj = user.toObject();
      if (userObj.photo && !userObj.photo.startsWith('http') && !userObj.photo.startsWith('data:')) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const fileName = userObj.photo.split('/').pop();
        userObj.photo = `${baseUrl}/uploads/${fileName}`;
      }
      return userObj;
    });

    // 🔹 compter le total pour pagination
    const total = await User.countDocuments(filter);

    res.json({
      total, // nombre total d'utilisateurs correspondant
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      users: usersWithPhotoUrl
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};



exports.uploadDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });
    const paths = req.files.map(f => f.path);
    const user = await User.findById(req.user._id);
    user.documents.push(...paths);
    await user.save();
    res.json({ message: 'Files uploaded', files: paths });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// controllers/userController.js

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    await user.deleteOne(); // supprime l'utilisateur
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json(err.message);
  }
};

// Approuver un mentor (Admin)
exports.approveMentor = async (req, res) => {
  try {
    console.log(`Tentative d'approbation pour l'utilisateur ID: ${req.params.id}`);
    const user = await User.findById(req.params.id);
    if (!user) {
      console.log(`Utilisateur non trouvé pour ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    if (user.role !== 'mentore') {
      console.log(`L'utilisateur ${user.email} n'est pas un mentor (rôle: ${user.role})`);
      return res.status(400).json({ message: 'Cet utilisateur n\'est pas un mentor' });
    }

    user.isApproved = true;
    await user.save();
    console.log(`Mentor ${user.email} approuvé avec succès`);

    // Créer une notification pour le mentor
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        recipient: user._id,
        type: 'mentor_approved',
        title: 'Félicitations ! Votre profil mentor a été approuvé',
        message: 'Vous êtes désormais visible sur la plateforme et pouvez recevoir des demandes de mentorat.'
      });
    } catch (notifErr) {
      console.error('Erreur creation notification approbation:', notifErr);
    }

    res.json({ success: true, message: 'Mentor approuvé avec succès', user });
  } catch (error) {
    console.error('Erreur approveMentor:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer les mentores en attente d'approbation (Admin)
exports.getPendingMentors = async (req, res) => {
  try {
    const pendingMentors = await User.find({ role: 'mentore', isApproved: false })
      .select('-password')
      .sort({ createdAt: -1 });

    const mentorsWithPhoto = pendingMentors.map(user => {
      const userObj = user.toObject();
      if (userObj.photo && !userObj.photo.startsWith('http') && !userObj.photo.startsWith('data:')) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const fileName = userObj.photo.split('/').pop();
        userObj.photo = `${baseUrl}/uploads/${fileName}`;
      }
      return userObj;
    });

    res.json({ mentors: mentorsWithPhoto, total: mentorsWithPhoto.length });
  } catch (error) {
    console.error('Erreur getPendingMentors:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Rejeter un mentor (Admin) - désactive le compte
exports.rejectMentor = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    if (user.role !== 'mentore') return res.status(400).json({ message: 'Cet utilisateur n\'est pas un mentor' });

    user.isApproved = false;
    user.verified = false; // Désactiver le compte
    await user.save();

    // Notifier le mentor du rejet
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        recipient: user._id,
        type: 'mentor_rejected',
        title: 'Votre profil mentor n\'a pas été approuvé',
        message: reason
          ? `Raison : ${reason}. Vous pouvez mettre à jour votre profil et soumettre à nouveau.`
          : 'Votre profil ne correspond pas encore à nos critères. Veuillez mettre à jour votre expertise et votre parcours.'
      });
    } catch (notifErr) {
      console.error('Erreur notification rejet:', notifErr);
    }

    res.json({ success: true, message: 'Mentor rejeté', user });
  } catch (error) {
    console.error('Erreur rejectMentor:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimé car doublon corrigé plus haut

// Upload photo de profil
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }

    const photoPath = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { photo: photoPath },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Ajouter l'URL complète pour la photo
    const userObj = user.toObject();
    if (userObj.photo && !userObj.photo.startsWith('http') && !userObj.photo.startsWith('data:')) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      userObj.photo = `${baseUrl}/uploads/${userObj.photo.split('/').pop()}`;
    }

    res.json({ message: 'Photo de profil mise à jour', user: userObj });
  } catch (error) {
    console.error('Erreur upload photo:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

