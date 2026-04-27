const Partner = require('../models/Partner');
const { uploadToGridFS, deleteFromGridFS } = require('../utils/gridfsUtils');

// Obtenir tous les partenaires actifs (public)
exports.getPartners = async (req, res) => {
  try {
    const partners = await Partner.find({ isActive: true }).sort({ createdAt: -1 });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const partnersWithUrl = partners.map(partner => {
      const p = partner.toObject();
      if (p.logo && p.logo.startsWith('/uploads')) {
        p.logo = `${baseUrl}${p.logo}`;
      }
      return p;
    });
    res.json(partnersWithUrl);
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
      logoPath = await uploadToGridFS(req.file.path, `partner-${Date.now()}-${req.file.originalname}`, req.file.mimetype);
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

    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partenaire non trouvé' });
    }

    // Supprimer le logo de GridFS si ce n'est pas l'émoji par défaut
    if (partner.logo && partner.logo.startsWith('/api/files/')) {
      await deleteFromGridFS(partner.logo);
    }

    await Partner.findByIdAndDelete(req.params.id);
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

    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partenaire non trouvé' });
    }

    // Si un nouveau logo est uploadé
    if (req.file) {
      // Supprimer l'ancien logo
      if (partner.logo && partner.logo.startsWith('/api/files/')) {
        await deleteFromGridFS(partner.logo);
      }
      updateData.logo = await uploadToGridFS(req.file.path, `partner-${Date.now()}-${req.file.originalname}`, req.file.mimetype);
    }

    Object.assign(partner, updateData);
    await partner.save();

    res.json(partner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};