require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function run() {
    const client = await mongoose.connect(mongoURI);
    const db = client.connection.useDb('voix_avenir_db');
    const User = db.model('User', new mongoose.Schema({ email: String, name: String }), 'users');
    
    console.log('Utilisateurs dans voix_avenir_db:');
    const users = await User.find({}).limit(10);
    users.forEach(u => console.log(`- ${u.email} (${u.name})`));
    
    // Search for specifically tested emails
    const test1 = await User.findOne({ email: /aissatoudiallo.nene29/i });
    console.log('Test aissatoudiallo.nene29:', test1 ? 'FOUND' : 'NOT_FOUND');
    
    const test2 = await User.findOne({ email: /hadiadiallo/i });
    console.log('Test hadiadiallo:', test2 ? 'FOUND' : 'NOT_FOUND');
    
    process.exit();
}

run().catch(err => {
    console.error(err);
    process.exit();
});
