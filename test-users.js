require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  const users = await User.find().select('name').lean();
  console.log("Total users:", users.length);
  users.forEach(u => console.log(u.name));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
