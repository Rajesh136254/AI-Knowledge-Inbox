require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
console.log("Testing Gemini API...");
console.log("API Key:", apiKey ? `${apiKey.substring(0, 10)}...` : "NOT SET");

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function test() {
    try {
        console.log("\n1. Testing simple query...");
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [{ text: "Say 'OK' if you can read this" }]
            }]
        });
        const response = await result.response;
        const text = response.text();
        console.log("✅ Simple test successful!");
        console.log("Response:", text);

        console.log("\n2. Testing complex query...");
        const result2 = await model.generateContent({
            contents: [{
                role: "user",
                parts: [{ text: "What is machine learning?" }]
            }]
        });
        const response2 = await result2.response;
        const text2 = response2.text();
        console.log("✅ Complex test successful!");
        console.log("Response:", text2.substring(0, 200) + "...");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("Status:", error.status || error.statusCode);
        console.error("Full error:", error);
    }
}

test();
