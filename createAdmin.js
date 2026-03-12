const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mentora_gn');
    console.log('✅ Connecté à MongoDB');

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: 'admin@mentora.gn' });
    if (existingAdmin) {
      console.log('❌ Un administrateur avec cet email existe déjà');
      process.exit(0);
    }

    // Hasher le mot de passe
    const password = 'AdminMentora2024!';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'administrateur
    const admin = new User({
      name: 'Administrateur Principal',
      email: 'admin@mentora.gn',
      password: hashedPassword,
      role: 'admin',
      verified: true,
      city: 'Conakry',
      profession: 'Administrateur Système',
      bio: 'Administrateur principal de la plateforme Mentora GN',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await admin.save();
    
    console.log('🎉 Administrateur créé avec succès !');
    console.log('📧 Email: admin@mentora.gn');
    console.log('🔑 Mot de passe: AdminMentora2024!');
    console.log('⚠️  Changez ce mot de passe après la première connexion');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createAdmin();