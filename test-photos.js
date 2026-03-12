// Script de test pour vérifier les photos
const User = require('./models/User');
require('dotenv').config();
require('./config/db')();

const testPhotos = async () => {
  try {
    console.log('🔍 Recherche des utilisateurs avec photos...');
    
    const usersWithPhotos = await User.find({ 
      photo: { $exists: true, $ne: null, $ne: '' } 
    }).select('name role photo');
    
    console.log(`📸 ${usersWithPhotos.length} utilisateurs avec photos trouvés:`);
    
    usersWithPhotos.forEach(user => {
      const photoUrl = `http://localhost:${process.env.PORT || 3000}/uploads/${user.photo.split('/').pop()}`;
      console.log(`- ${user.name} (${user.role}): ${photoUrl}`);
    });
    
    console.log('\n✅ Test terminé');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

testPhotos();