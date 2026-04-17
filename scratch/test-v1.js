require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testV1() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('Testing gemini-1.5-flash with apiVersion v1...');
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
        const result = await model.generateContent("test");
        console.log("SUCCESS with v1:", result.response.text());
    } catch (e) {
        console.log("FAILED with v1:", e.message);
    }
}

testV1();
