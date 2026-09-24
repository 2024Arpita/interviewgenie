const { GoogleGenAI } = require("@google/genai");
const {
  conceptExplainPrompt,
  questionAnswerPrompt,
  answerEvaluationPrompt,
} = require("../utils/prompts");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Helper function to call Gemini with retry logic
const generateWithRetry = async (prompt, config = {}) => {
  let response;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Gemini API attempt ${attempt}/3`);

      response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: config,
      });

      console.log("Gemini API request successful");

      return response;
    } catch (error) {
      console.error(
        `Gemini API attempt ${attempt} failed:`,
        error.message
      );

      // Retry only for temporary service-unavailable errors
      if (error.status !== 503 || attempt === 3) {
        throw error;
      }

      const delay = attempt * 2000;

      console.log(
        `Gemini temporarily unavailable. Retrying in ${delay / 1000
        } seconds...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

//@desc Generate interview questions and answers using Gemini
//@route POST /api/ai/generate-questions
//@access Private
const generateInterviewQuestions = async (req, res) => {
  try {
    const {
      role,
      experience,
      topicsToFocus,
      numberOfQuestions,
    } = req.body;

    // Validate input
    if (
      !role ||
      !experience ||
      !topicsToFocus ||
      !numberOfQuestions
    ) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // Create prompt
    const prompt = questionAnswerPrompt(
      role,
      experience,
      topicsToFocus,
      numberOfQuestions
    );

    // Call Gemini with retry logic
    const response = await generateWithRetry(prompt);

    let rawText = response.text;

    if (!rawText) {
      throw new Error("Gemini returned an empty response");
    }

    console.log("Raw Gemini response received");

    // Remove Markdown JSON code fences if present
    const cleanedText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    // Parse JSON
    const data = JSON.parse(cleanedText);

    res.status(200).json(data);
  } catch (error) {
    console.error("GENERATE QUESTIONS ERROR:", error);

    res.status(500).json({
      message: "Failed to generate questions",
      error: error.message,
    });
  }
};

//@desc Generate explanation for an interview question
//@route POST /api/ai/generate-explanation
//@access Private
const generateConceptExplaination = async (req, res) => {
  try {
    const { question } = req.body;

    // Validate input
    if (!question) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // Create prompt
    const prompt = conceptExplainPrompt(question);

    // Call Gemini with retry logic
    const response = await generateWithRetry(prompt);

    let rawText = response.text;

    if (!rawText) {
      throw new Error("Gemini returned an empty response");
    }

    // Remove Markdown JSON code fences if present
    const cleanedText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    // Parse JSON
    const data = JSON.parse(cleanedText);

    res.status(200).json(data);
  } catch (error) {
    console.error("GENERATE EXPLANATION ERROR:", error);

    res.status(500).json({
      message: "Failed to generate explanation",
      error: error.message,
    });
  }
};

//@desc Evaluate a user's answer to an interview question using Gemini
//@route POST /api/ai/evaluate-answer
//@access Private
const evaluateAnswer = async (req, res) => {
  try {
    const { question, userAnswer, role, experience } = req.body;

    // Validate input
    if (!question || !role || !experience) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    if (!userAnswer || !userAnswer.trim()) {
      return res.status(400).json({
        message: "Please enter your answer before submitting.",
      });
    }

    // Create prompt
    const prompt = answerEvaluationPrompt(question, userAnswer, role, experience);

    // Call Gemini with retry logic and structured JSON output
    const response = await generateWithRetry(prompt, {
      responseMimeType: "application/json",
    });

    let rawText = response.text;

    if (!rawText) {
      throw new Error("Gemini returned an empty response");
    }

    console.log("Raw Gemini evaluation response received");

    // Remove Markdown JSON code fences if present (safety fallback)
    const cleanedText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    // Parse JSON
    const data = JSON.parse(cleanedText);

    // Validate the response structure
    if (
      typeof data.score !== "number" ||
      data.score < 0 ||
      data.score > 10 ||
      !Array.isArray(data.strengths) ||
      !Array.isArray(data.weaknesses) ||
      !Array.isArray(data.missingConcepts) ||
      typeof data.feedback !== "string" ||
      typeof data.idealAnswer !== "string"
    ) {
      console.error("EVALUATE ANSWER: Invalid response structure from Gemini:", data);
      throw new Error("AI returned an invalid evaluation format");
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("EVALUATE ANSWER ERROR:", error);

    // Check if it's a service unavailable error after retries
    if (error.status === 503) {
      return res.status(503).json({
        message: "AI service is temporarily unavailable. Please try again.",
      });
    }

    res.status(500).json({
      message: "Failed to evaluate answer",
      error: error.message,
    });
  }
};

module.exports = {
  generateInterviewQuestions,
  generateConceptExplaination,
  evaluateAnswer,
};