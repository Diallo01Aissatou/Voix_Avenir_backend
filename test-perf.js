require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.time('fetchMentors');
  const users = await User.find({ role: 'mentore' }).select('photo').lean();
  console.timeEnd('fetchMentors');
  
  let totalPhotoSize = 0;
  for (const user of users) {
    if (user.photo) {
      totalPhotoSize += user.photo.length;
    }
  }
  
  console.log(`Total Mentors: ${users.length}`);
  console.log(`Total Photo Size: ${(totalPhotoSize / 1024 / 1024).toFixed(2)} MB`);
  
  console.time('fixPhotoUrl');
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
    return photo;
  };
  
  users.forEach(u => {
    if (u.photo) fixPhotoUrl(u.photo);
  });
  console.timeEnd('fixPhotoUrl');

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
