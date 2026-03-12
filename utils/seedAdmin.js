require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');

const run = async () => {
  await connectDB(process.env.MONGODB_URI);
  const existing = await User.findOne({ email: 'admin@mentora.gn' });
  if (existing) {
    console.log('Admin exists');
    process.exit(0);
  }
  const hash = await bcrypt.hash('Admin123!', 10);
  await User.create({
    role: 'admin',
    name: 'Admin Mentora',
    email: 'admin@mentora.gn',
    passwordHash: hash,
    verified: true
  });
  console.log('Admin created: admin@mentora.gn / Admin123!');
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
