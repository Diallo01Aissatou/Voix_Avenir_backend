require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        // You need to call the API via fetch or use the admin SDK if available
        // Or we can try to find a model by guessing more
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        console.log("Listing models is not directly supported in the simple SDK without additional setup.");
        console.log("Let's try one that is definitely working for most people right now: gemini-pro");
        
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("test");
        console.log("SUCCESS with gemini-pro:", result.response.text());
    } catch (e) {
        console.log("FAILED with gemini-pro:", e.message);
    }
}

listModels();
