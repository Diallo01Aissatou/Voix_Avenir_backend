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
      if (userObj.photo) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        userObj.photo = `${baseUrl}/uploads/${userObj.photo.split('/').pop()}`;
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
    const cities = await User.distinct('city', { city: { $ne: null, $ne: '' } });
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Obtenir la liste des expertises
exports.getExpertise = async (req, res) => {
  try {
    const expertises = await User.aggregate([
      { $match: { role: 'mentore', expertise: { $exists: true, $ne: [] } } },
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
    if (userObj.photo) {
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
    const { bio, expertise, availableDays, startTime, endTime } = req.body;
    console.log('Données reçues pour mise à jour profil:', {
      bio, expertise, availableDays, startTime, endTime
    });
    console.log('Type de expertise:', typeof expertise);
    console.log('Contenu expertise:', expertise);
    console.log('Est un tableau:', Array.isArray(expertise));

    // Forcer la mise à jour de l'expertise
    const updateData = {
      bio: bio || '',
      availableDays: availableDays || [],
      startTime: startTime || '09:00',
      endTime: endTime || '17:00',
      updatedAt: new Date()
    };

    // Traiter l'expertise spécialement
    if (expertise) {
      if (Array.isArray(expertise)) {
        updateData.expertise = expertise.filter(e => e && e.trim());
      } else if (typeof expertise === 'string') {
        updateData.expertise = expertise.split(',').map(e => e.trim()).filter(Boolean);
      } else {
        updateData.expertise = [];
      }
    }

    console.log('Données finales à sauvegarder:', updateData);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    console.log('Profil mis à jour avec succès, expertise:', user.expertise);
    res.json({ success: true, message: 'Profil mis à jour', user });
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
    res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
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
    const totalMentores = await User.countDocuments({ role: 'mentore' });
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
    const totalMentores = await User.countDocuments({ role: 'mentore' });
    const totalMentorees = await User.countDocuments({ role: 'mentoree' });

    res.json({
      totalUsers,
      totalMentores,
      totalMentorees
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

exports.searchMentors = async (req, res) => {
  try {
    const { q, city, expertise, page = 1, limit = 10 } = req.query;

    // 🔹 filtre de base = vide → affiche tout
    const filter = {};

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
      if (userObj.photo) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        userObj.photo = `${baseUrl}/uploads/${userObj.photo.split('/').pop()}`;
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

// Upload photo de profil
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }

    const photoPath = req.file.filename;
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
    if (userObj.photo) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      userObj.photo = `${baseUrl}/uploads/${userObj.photo.split('/').pop()}`;
    }

    res.json({ message: 'Photo de profil mise à jour', user: userObj });
  } catch (error) {
    console.error('Erreur upload photo:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

