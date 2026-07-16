require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: "Hello",
    });

    console.log(response);
  } catch (e) {
    console.error(e);
  }
}

test();