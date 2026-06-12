require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  const makale = await User.findOne({ name: /Makale/i }).select('photo').lean();
  console.log("Raw photo length:", makale?.photo ? makale.photo.length : 0);
  console.log("Raw photo preview:", makale?.photo ? makale.photo.substring(0, 100) + "..." : null);
  
  // Backend logic
  const fixPhotoUrl = (photo) => {
    if (!photo) return photo;
    let cleanPhoto = photo.trim();
    if (cleanPhoto.startsWith('"') && cleanPhoto.endsWith('"')) {
      cleanPhoto = cleanPhoto.slice(1, -1);
    }
    if (cleanPhoto.includes('data:image')) {
      return cleanPhoto.substring(cleanPhoto.indexOf('data:image')).replace(/[\s\r\n"\\]/g, '');
    }
    if (cleanPhoto.startsWith('http') || cleanPhoto.startsWith('data:')) {
      return cleanPhoto.startsWith('data:') ? cleanPhoto.replace(/[\s\r\n"\\]/g, '') : cleanPhoto;
    }
    if (cleanPhoto.length > 200) return `data:image/jpeg;base64,${cleanPhoto.replace(/[\s\r\n"\\]/g, '')}`;
    const baseUrl = `http://localhost:5001`;
    if (cleanPhoto.startsWith('/')) return `${baseUrl}${cleanPhoto}`;
    return `${baseUrl}/uploads/${cleanPhoto.split('/').pop()}`;
  };

  const backendPhoto = fixPhotoUrl(makale?.photo);
  console.log("\nBackend processed length:", backendPhoto ? backendPhoto.length : 0);
  console.log("Backend processed preview:", backendPhoto ? backendPhoto.substring(0, 100) + "..." : null);

  // Frontend logic
  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    let cleanPhoto = photo.trim();
    if (cleanPhoto.startsWith('"') && cleanPhoto.endsWith('"')) {
      cleanPhoto = cleanPhoto.slice(1, -1);
    }
    if (cleanPhoto.includes('data:image')) {
      const index = cleanPhoto.indexOf('data:image');
      return cleanPhoto.substring(index).replace(/[\s\r\n"\\]/g, '');
    }
    if (cleanPhoto.startsWith('data:')) {
      return cleanPhoto.replace(/[\s\r\n"\\]/g, '');
    }
    if (cleanPhoto.startsWith('http')) {
      return `${cleanPhoto}?v=123`;
    }
    if (cleanPhoto.length > 200) {
      if (!cleanPhoto.startsWith('data:')) {
        return `data:image/jpeg;base64,${cleanPhoto.replace(/[\s\r\n"\\]/g, '')}`;
      }
    }
    const BASE_URL = 'http://localhost:5001';
    if (cleanPhoto.startsWith('/')) {
      return `${BASE_URL}${cleanPhoto}?v=123`;
    }
    const fileName = cleanPhoto.split('/').pop();
    return `${BASE_URL}/uploads/${fileName}?v=123`;
  };

  const frontendPhoto = getPhotoUrl(backendPhoto);
  console.log("\nFrontend final length:", frontendPhoto ? frontendPhoto.length : 0);
  console.log("Frontend final preview:", frontendPhoto ? frontendPhoto.substring(0, 100) + "..." : null);

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
