const questionAnswerPrompt = (
  role,
  experience,
  topicsToFocus,
  numberOfQuestions
) => `
You are an AI trained to generate technical interview questions and answers.

Task:
- Role: ${role}
- Candidate Experience: ${experience} years
- Focus Topics: ${topicsToFocus}
- Write ${numberOfQuestions} interview questions.
- For each question, generate a detailed but beginner-friendly answer.
- If the answer needs a code example, add a small code block inside.
- Keep formatting very clean.
- Return a pure JSON array like:

[
  {
    "question": "Question here?",
    "answer": "Answer here."
  },
  ...
]
  

Important: Do NOT add any extra text. Only return valid JSON.
`;

const conceptExplainPrompt = (question) => `
You are an AI trained to generate explanations for a given interview question.

Task:

- Explain the following interview question and its concept in depth as if you're teaching a beginner developer.
- Question: "${question}"
- After the explanation, provide a short and clear title that summarizes the concept for the article or page header.
- If the explanation includes a code example, provide a small code block.
- Keep the formatting very clean and clear.
- Return the result as a valid JSON object in the following format:

{
  "title": "Short title here?",
  "explanation": "Explanation here."
}

Important: Do NOT add any extra text outside the JSON format. Only return valid JSON.
`;

const answerEvaluationPrompt = (question, userAnswer, role, experience) => `
You are an expert technical interviewer evaluating a candidate's answer to an interview question.

Context:
- Role: ${role}
- Experience Level: ${experience} years
- Question: "${question}"
- Candidate's Answer: "${userAnswer}"

Evaluate the candidate's answer based on:
1. Technical correctness
2. Completeness
3. Understanding of the concept
4. Relevance to the question
5. Clarity of explanation

IMPORTANT: Do NOT judge the candidate based on grammar or English fluency unless it affects the clarity of the technical answer.

Return ONLY a valid JSON object in this exact format:

{
  "score": <number between 0 and 10>,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "missingConcepts": ["concept 1", "concept 2"],
  "feedback": "Overall feedback paragraph here",
  "idealAnswer": "A concise, interview-ready ideal answer here"
}

Important: Return ONLY valid JSON. Do NOT add any extra text, markdown, or code fences.
`;

module.exports = {
  questionAnswerPrompt,
  conceptExplainPrompt,
  answerEvaluationPrompt,
};