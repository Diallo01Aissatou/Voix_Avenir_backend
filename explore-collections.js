require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));
  
  // Try to find ANY MentorshipRequest or similar name
  for (const coll of collections) {
    if (coll.name.toLowerCase().includes('mentor')) {
      const docs = await mongoose.connection.db.collection(coll.name).find({}).limit(1).toArray();
      console.log(`Collection ${coll.name} has ${docs.length} docs`);
    }
  }

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
