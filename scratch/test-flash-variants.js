require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listAllModels() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using a model that is likely to exist to see if we can get a response
        // Or using the listModels method if available in this version of the SDK
        
        console.log('Testing with gemini-1.5-flash...');
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("test");
            console.log("Success with gemini-1.5-flash");
        } catch (e) {
            console.log("Failed gemini-1.5-flash:", e.message);
        }

        console.log('Testing with gemini-1.5-flash-latest...');
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
            const result = await model.generateContent("test");
            console.log("Success with gemini-1.5-flash-latest");
        } catch (e) {
            console.log("Failed gemini-1.5-flash-latest:", e.message);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

listAllModels();
