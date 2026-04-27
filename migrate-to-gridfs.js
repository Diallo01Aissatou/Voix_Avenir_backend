const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Resource = require('./models/Resource');
const Partner = require('./models/Partner');
const User = require('./models/User');
const News = require('./models/News');
const Event = require('./models/Event');
const { initGridFS } = require('./config/gridfs');

const migrateFile = async (localRelativePath, bucket) => {
  if (!localRelativePath || !localRelativePath.startsWith('/uploads')) return localRelativePath;

  const absolutePath = path.join(__dirname, localRelativePath);
  
  if (fs.existsSync(absolutePath)) {
    console.log(`MIGRATION : Fichier trouvé localement : ${absolutePath}`);
    const filename = path.basename(absolutePath);
    const uploadStream = bucket.openUploadStream(filename);
    
    return new Promise((resolve) => {
      fs.createReadStream(absolutePath)
        .pipe(uploadStream)
        .on('finish', () => {
          console.log(`✅ Succès : ${filename} migré vers GridFS`);
          resolve(`/api/files/${uploadStream.id}`);
        })
        .on('error', (err) => {
          console.error(`❌ Erreur migration ${filename}:`, err.message);
          resolve(localRelativePath);
        });
    });
  } else {
    console.warn(`⚠️ Fichier ABSENT localement : ${localRelativePath}. Probablement supprimé par Render.`);
    return localRelativePath; // On laisse tel quel, le catch-all dans server.js gérera le 404 propre
  }
};

const runMigration = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('Connecté à MongoDB');
    
    const bucket = initGridFS(mongoose.connection.db);

    // 1. Ressources
    console.log('\n--- Migration des Ressources ---');
    const resources = await Resource.find({ $or: [{ fileUrl: /^\/uploads/ }, { image: /^\/uploads/ }] });
    for (const res of resources) {
      if (res.fileUrl && res.fileUrl.startsWith('/uploads')) res.fileUrl = await migrateFile(res.fileUrl, bucket);
      if (res.image && res.image.startsWith('/uploads')) res.image = await migrateFile(res.image, bucket);
      await res.save();
    }

    // 2. Partenaires
    console.log('\n--- Migration des Partenaires ---');
    const partners = await Partner.find({ logo: /^\/uploads/ });
    for (const p of partners) {
      p.logo = await migrateFile(p.logo, bucket);
      await p.save();
    }

    // 3. Utilisateurs (Photos)
    console.log('\n--- Migration des Photos de Profil ---');
    const users = await User.find({ photo: /^\/uploads/ });
    for (const u of users) {
      u.photo = await migrateFile(u.photo, bucket);
      await u.save();
    }

    // 4. Actualités
    console.log('\n--- Migration des Actualités ---');
    const news = await News.find({ image: /^\/uploads/ });
    for (const n of news) {
      n.image = await migrateFile(n.image, bucket);
      await n.save();
    }

    // 5. Événements
    console.log('\n--- Migration des Événements ---');
    const events = await Event.find({ image: /^\/uploads/ });
    for (const e of events) {
      e.image = await migrateFile(e.image, bucket);
      await e.save();
    }

    console.log('\n✅ Migration terminée avec succès.');
    process.exit(0);
  } catch (error) {
    console.error('Erreur fatale lors de la migration:', error);
    process.exit(1);
  }
};

runMigration();
