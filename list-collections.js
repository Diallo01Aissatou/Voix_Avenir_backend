const dns = require('dns');
dns.setServers(['8.8.8.8']);

require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(mongoURI)
    .then(async () => {
        console.log('Connected to DB:', mongoose.connection.name);
        const adminDb = mongoose.connection.db.admin();
        const dbs = await adminDb.listDatabases();
        console.log('Databases:', dbs.databases.map(d => d.name));
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in current DB:', collections.map(c => c.name));
        
        process.exit();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit();
    });
