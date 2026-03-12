const Resource = require('../models/Resource');

// Obtenir toutes les ressources actives
exports.getResources = async (req, res) => {
  try {
    const resources = await Resource.find({ isActive: true }).sort('-createdAt');
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Créer une nouvelle ressource (admin)
exports.createResource = async (req, res) => {
  try {
    console.log('Body reçu:', req.body);
    console.log('Fichiers reçus:', req.files);

    const resourceData = req.body;

    // Vérifier les champs obligatoires
    if (!resourceData.title || !resourceData.description || !resourceData.category || !resourceData.type) {
      return res.status(400).json({
        message: 'Champs obligatoires manquants',
        required: ['title', 'description', 'category', 'type']
      });
    }

    // Gérer l'image
    if (req.files && req.files.image) {
      resourceData.image = `/uploads/${req.files.image[0].filename}`;
    }

    // Gérer le fichier de ressource
    if (req.files && req.files.resourceFile) {
      resourceData.fileUrl = `/uploads/resources/${req.files.resourceFile[0].filename}`;
      console.log('Fichier de ressource sauvegardé:', resourceData.fileUrl);
    } else {
      console.log('Aucun fichier de ressource reçu');
    }

    console.log('Données finales:', resourceData);

    const resource = await Resource.create(resourceData);
    console.log('Ressource créée:', resource);

    res.status(201).json({ message: 'Ressource ajoutée avec succès', resource });
  } catch (error) {
    console.error('Erreur lors de la création de ressource:', error);
    res.status(500).json({
      message: 'Erreur serveur',
      error: error.message,
      details: error.stack
    });
  }
};

// Mettre à jour une ressource (admin)
exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    let resource = await Resource.findById(id);

    if (!resource) {
      return res.status(404).json({ message: 'Ressource non trouvée' });
    }

    const updateData = req.body;

    // Gérer l'image si fournie
    if (req.files && req.files.image) {
      updateData.image = `/uploads/${req.files.image[0].filename}`;
    }

    // Gérer le fichier de ressource si fourni
    if (req.files && req.files.resourceFile) {
      updateData.fileUrl = `/uploads/resources/${req.files.resourceFile[0].filename}`;
    }

    resource = await Resource.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({ message: 'Ressource mise à jour avec succès', resource });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de ressource:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer une ressource (admin)
exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    await Resource.findByIdAndDelete(id);
    res.json({ message: 'Ressource supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Mettre à jour le statut vedette (admin)
exports.toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: 'Ressource non trouvée' });
    }

    resource.isFeatured = !resource.isFeatured;
    await resource.save();

    res.json({ message: 'Statut vedette mis à jour', resource });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Incrémenter le compteur de téléchargements
exports.incrementDownload = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findByIdAndUpdate(
      id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({ message: 'Ressource non trouvée' });
    }

    res.json({ message: 'Compteur mis à jour', downloadCount: resource.downloadCount });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Incrémenter le compteur de vues/consultations
exports.incrementViews = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({ message: 'Ressource non trouvée' });
    }

    res.json({ message: 'Compteur de vues mis à jour', views: resource.views });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Télécharger un fichier
exports.downloadFile = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id);
    if (!resource || !resource.fileUrl) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    // Incrémenter le compteur
    await Resource.findByIdAndUpdate(id, { $inc: { downloadCount: 1 } });

    const axios = require('axios');
    const path = require('path');

    try {
      // Télécharger le fichier depuis l'URL
      const response = await axios({
        method: 'GET',
        url: resource.fileUrl,
        responseType: 'stream'
      });

      // Définir les en-têtes pour forcer le téléchargement
      const fileName = `${resource.title.replace(/[^a-z0-9\s]/gi, '_')}.${getFileExtension(resource.type)}`;

      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', response.headers['content-length']);

      // Pipe le fichier directement vers la réponse
      response.data.pipe(res);

    } catch (downloadError) {
      console.error('Erreur téléchargement:', downloadError);
      // Fallback: redirection simple
      res.redirect(resource.fileUrl);
    }

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

function getFileExtension(type) {
  switch (type) {
    case 'pdf': return 'pdf';
    case 'video': return 'mp4';
    case 'article': return 'html';
    case 'guide': return 'pdf';
    default: return 'file';
  }
}