require('dotenv').config();
const mongoose = require('mongoose');
const Contact = require('./models/Contact');
const contactController = require('./controllers/contactController');

async function testContactApi() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log("Connected.");

    const req = {
      body: {
        name: "Test User",
        email: "test@example.com",
        subject: "technique",
        message: "Ceci est un message de test pour vérifier l'intégration complète."
      }
    };

    const res = {
      status: (code) => {
        console.log("Response Status:", code);
        return res;
      },
      json: (data) => {
        console.log("Response Data:", JSON.stringify(data, null, 2));
      }
    };

    console.log("Executing contactController.submitContactForm...");
    await contactController.submitContactForm(req, res);
    
    // Check if saved in DB
    const saved = await Contact.findOne({ email: "test@example.com" }).sort({ createdAt: -1 });
    if (saved) {
      console.log("✅ Message saved in DB successfully!");
      console.log("ID:", saved._id);
    } else {
      console.log("❌ Message NOT found in DB.");
    }

  } catch (err) {
    console.error("Critical Test Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from DB.");
  }
}

testContactApi();
