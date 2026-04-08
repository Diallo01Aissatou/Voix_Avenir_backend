require('dotenv').config();
const mongoose = require('mongoose');
const UserSchema = require('./models/User').schema;

const checkPhotos = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        const db = mongoose.connection.useDb('voix_avenir_db');
        const User = db.model('User', UserSchema);

        const users = await User.find({ photo: { $exists: true, $ne: null } }).select('name email photo').limit(10);
        console.log(`Checking ${users.length} users with photos:`);
        users.forEach(u => {
            console.log(`- ${u.name}: "${u.photo}"`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkPhotos();
