require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const fixPhotoUrl = (photo) => {
    if (!photo) return photo;
    if (photo.includes('data:image')) return photo.substring(photo.indexOf('data:image'));
    if (photo.startsWith('http') || photo.startsWith('data:')) return photo;
    
    // Chemin relatif (GridFS: /api/files/ID  ou  /uploads/filename)
    const baseUrl = `https://voix-avenir-backend.onrender.com`;
    if (photo.startsWith('/')) {
      return `${baseUrl}${photo}`;
    }
    // Nom de fichier simple → dossier uploads
    const fileName = photo.split('/').pop();
    return `${baseUrl}/uploads/${fileName}`;
  };

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // Recherchons les utilisatrices "Kadiatou Sow" et "Diaka Sidibé"
    const users = await User.find({ name: { $in: [/^Kadiatou/i, /^Diaka/i] } });
    
    console.log(`Found ${users.length} users`);
    for (const u of users) {
      console.log(`\nUser: ${u.name}`);
      console.log(`Raw Photo: ${u.photo ? u.photo.substring(0, 100) + '...' : 'null'}`);
      console.log(`Fixed Photo: ${fixPhotoUrl(u.photo)?.substring(0, 100) + '...'}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
