require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    try {
        console.log('Using API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // This is a hacky way to test a few models since the SDK doesn't have a direct 'listModels' in the simple version
        const modelsToTest = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-pro",
            "gemini-1.0-pro"
        ];

        for (const modelName of modelsToTest) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello");
                const response = await result.response;
                console.log(`✅ Model ${modelName} is working:`, response.text().substring(0, 20) + '...');
                return modelName; // Found one!
            } catch (err) {
                console.log(`❌ Model ${modelName} failed:`, err.message);
            }
        }
    } catch (error) {
        console.error('List models error:', error);
    }
}

listModels();
