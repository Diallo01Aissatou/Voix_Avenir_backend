require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function run() {
    const client = await mongoose.connect(mongoURI);
    const admin = client.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('Databases:');
    for (const dbInfo of dbs.databases) {
        console.log(`- ${dbInfo.name}`);
        const db = client.connection.useDb(dbInfo.name);
        const collections = await db.db.listCollections().toArray();
        collections.forEach(c => console.log(`  * ${c.name}`));
    }
    process.exit();
}

run().catch(err => {
    console.error(err);
    process.exit();
});
