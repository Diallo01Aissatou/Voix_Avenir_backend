require('dotenv').config();
const mongoose = require('mongoose');

async function testDB() {
  try {
    console.log('Tentative de connexion à MongoDB...');
    console.log('URI:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connecté avec succès');
    
    // Test simple
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections disponibles:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('Connexion fermée');
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
}

testDB();