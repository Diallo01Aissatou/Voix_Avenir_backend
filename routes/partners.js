const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const Partner = require('../models/Partner');
const fs = require('fs');

// GET - Obtenir tous les partenaires actifs (public)
router.get('/', async (req, res) => {
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
});

// POST - Ajouter un partenaire (admin uniquement)
router.post('/', protect, upload.single('logo'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Seuls les administrateurs peuvent ajouter des partenaires' });
    }

    const { name, website, description } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Le nom du partenaire est requis' });
    }

    let logoPath = '🏢';
    if (req.file) {
      try {
        const logoData = fs.readFileSync(req.file.path);
        const base64Logo = logoData.toString('base64');
        logoPath = `data:${req.file.mimetype};base64,${base64Logo}`;
        // Supprimer le fichier physique après conversion pour économiser l'espace sur Render
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Erreur conversion Base64:', err);
        logoPath = `/uploads/${req.file.filename}`;
      }
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
});

// DELETE - Supprimer un partenaire (admin uniquement)
router.delete('/:id', protect, async (req, res) => {
  try {
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
});

module.exports = router;