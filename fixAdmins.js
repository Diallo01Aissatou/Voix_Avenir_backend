require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function fixAdmins() {
  await mongoose.connect(process.env.MONGO_URI);
  const admins = await User.find({ role: 'admin' });
  console.log('Admins trouvés:', admins.length);
  
  for (let i = 0; i < admins.length; i++) {
    const a = admins[i];
    if (a.email !== 'admin@mentora.gn') {
      console.log('Suppression de l\'admin en trop:', a.email);
      await User.deleteOne({ _id: a._id });
    } else {
      console.log('Conservation de l\'admin principal:', a.email);
    }
  }
  process.exit();
}
fixAdmins();
