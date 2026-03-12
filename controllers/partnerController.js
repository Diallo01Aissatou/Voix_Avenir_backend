const Partner = require('../models/Partner');

// Obtenir tous les partenaires actifs (public)
exports.getPartners = async (req, res) => {
  try {
    const partners = await Partner.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Créer un partenaire (admin uniquement)
exports.createPartner = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Seuls les administrateurs peuvent ajouter des partenaires' });
    }

    const { name, website, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Le nom du partenaire est requis' });
    }

    let logoPath = '🏢';
    
    // Si un fichier logo a été uploadé
    if (req.file) {
      logoPath = `/uploads/partners/${req.file.filename}`;
    }

    const partner = new Partner({
      name: name.trim(),
      logo: logoPath,
      website: website || '',
      description: description || '',
      isActive: true
    });

    await partner.save();
    res.status(201).json(partner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Supprimer un partenaire (admin uniquement)
exports.deletePartner = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Seuls les administrateurs peuvent supprimer des partenaires' });
    }

    const partner = await Partner.findByIdAndDelete(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partenaire non trouvé' });
    }

    res.json({ message: 'Partenaire supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un partenaire (admin uniquement)
exports.updatePartner = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Seuls les administrateurs peuvent modifier des partenaires' });
    }

    const { name, website, description, isActive } = req.body;
    const updateData = { name, website, description, isActive };

    // Si un nouveau logo est uploadé
    if (req.file) {
      updateData.logo = `/uploads/partners/${req.file.filename}`;
    }

    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ message: 'Partenaire non trouvé' });
    }

    res.json(partner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};