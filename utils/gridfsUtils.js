const mongoose = require('mongoose');
const fs = require('fs');
const { getGridFSBucket } = require('../config/gridfs');

/**
 * Upload a local file to GridFS
 * @param {string} localPath - Path to the local file
 * @param {string} filename - Desired filename in GridFS
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<string>} - The serve URL for the file
 */
exports.uploadToGridFS = async (localPath, filename, contentType) => {
  const bucket = getGridFSBucket();
  if (!bucket) throw new Error('GridFS Bucket non disponible');

  const uploadStream = bucket.openUploadStream(filename, { contentType });

  return new Promise((resolve, reject) => {
    fs.createReadStream(localPath)
      .pipe(uploadStream)
      .on('error', (error) => {
        // Nettoyage si erreur
        try { fs.unlinkSync(localPath); } catch (e) {}
        reject(error);
      })
      .on('finish', () => {
        // Supprimer le fichier local après upload réussi
        try { fs.unlinkSync(localPath); } catch (e) {}
        resolve(`/api/files/${uploadStream.id}`);
      });
  });
};

/**
 * Delete a file from GridFS by its serve URL or ID
 * @param {string} url - The serve URL or ObjectId of the file
 * @returns {Promise<void>}
 */
exports.deleteFromGridFS = async (url) => {
  const bucket = getGridFSBucket();
  if (!bucket || !url) return;

  try {
    const id = url.includes('/') ? url.split('/').pop() : url;
    if (mongoose.Types.ObjectId.isValid(id)) {
      await bucket.delete(new mongoose.Types.ObjectId(id));
    }
  } catch (error) {
    console.warn('Erreur lors de la suppression GridFS:', error.message);
  }
};
