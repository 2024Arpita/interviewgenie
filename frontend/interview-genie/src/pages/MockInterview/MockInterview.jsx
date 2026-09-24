import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import Input from "../../components/Inputs/Input";
import SpinnerLoader from "../../components/Loader/SpinnerLoader";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPath";
import toast from "react-hot-toast";
import {
  LuSparkles,
  LuChevronRight,
  LuCircleCheck,
  LuCircleAlert,
  LuLightbulb,
  LuMessageSquare,
  LuTarget,
  LuTrophy,
  LuArrowLeft,
  LuBrain,
} from "react-icons/lu";

const MockInterview = () => {
  const navigate = useNavigate();

  // Flow states: "setup" | "generating" | "interview" | "summary"
  const [phase, setPhase] = useState("setup");

  // Setup form
  const [formData, setFormData] = useState({
    role: "",
    experience: "",
    topicsToFocus: "",
    numberOfQuestions: "5",
  });
  const [formError, setFormError] = useState("");

  // Interview state
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [answerError, setAnswerError] = useState("");

  // Track all evaluations for the final summary
  const [evaluations, setEvaluations] = useState([]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Step 1: Generate questions and create session in MongoDB
  const handleStartInterview = async (e) => {
    e.preventDefault();
    const { role, experience, topicsToFocus, numberOfQuestions } = formData;
    if (!role || !experience || !topicsToFocus) {
      setFormError("Please fill all required fields.");
      return;
    }
    setFormError("");
    setIsGenerating(true);
    setPhase("generating");

    try {
      // 1. Generate questions via AI
      const genResponse = await axiosInstance.post(
        API_PATHS.AI.GENERATE_QUESTIONS,
        {
          role,
          experience,
          topicsToFocus,
          numberOfQuestions: parseInt(numberOfQuestions) || 5,
        }
      );
      const generated = genResponse.data;
      if (!Array.isArray(generated) || generated.length === 0) {
        throw new Error("No questions generated");
      }

      // 2. Persist Mock Session & Questions to MongoDB
      const sessionResponse = await axiosInstance.post(
        API_PATHS.SESSION.CREATE,
        {
          role,
          experience,
          topicsToFocus,
          numberOfQuestions: parseInt(numberOfQuestions) || 5,
          mode: "mock",
          questions: generated,
        }
      );

      const createdSession = sessionResponse.data.session;
      if (!createdSession || !createdSession._id) {
        throw new Error("Failed to create session in database");
      }

      setSessionId(createdSession._id);
      setQuestions(createdSession.questions || []);
      setCurrentIndex(0);
      setEvaluations([]);
      setPhase("interview");
    } catch (error) {
      console.error("Error starting mock interview:", error);
      setFormError(
        error.response?.data?.message ||
          "Failed to start mock interview. Please try again."
      );
      setPhase("setup");
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 2: Submit answer for AI evaluation and persist to MongoDB
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      setAnswerError("Please enter your answer before submitting.");
      return;
    }
    setAnswerError("");
    setIsEvaluating(true);

    try {
      const currentQ = questions[currentIndex];
      const response = await axiosInstance.post(
        API_PATHS.AI.EVALUATE_ANSWER,
        {
          questionId: currentQ._id, // MongoDB _id of Question
          question: currentQ.question,
          userAnswer: userAnswer.trim(),
          role: formData.role,
          experience: formData.experience,
        }
      );

      const evalData = response.data;
      setEvaluation(evalData);

      // Store evaluation for the summary
      setEvaluations((prev) => [
        ...prev,
        {
          question: currentQ.question,
          userAnswer: userAnswer.trim(),
          ...evalData,
        },
      ]);
    } catch (error) {
      console.error("Error evaluating answer:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Failed to evaluate your answer. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Step 3: Move to next question or complete session
  const handleNextQuestion = async () => {
    if (currentIndex + 1 >= questions.length) {
      // All questions done, update session status to completed in MongoDB
      try {
        const stats = getSummaryStats();
        const avgScore = stats ? parseFloat(stats.avgScore) : 0;
        if (sessionId) {
          await axiosInstance.patch(API_PATHS.SESSION.COMPLETE(sessionId), {
            overallScore: avgScore,
          });
        }
        setPhase("summary");
      } catch (error) {
        console.error("Error completing session:", error);
        toast.error("Failed to mark session as completed in database. Please try again.");
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer("");
      setEvaluation(null);
      setAnswerError("");
    }
  };

  // Calculate summary stats
  const getSummaryStats = () => {
    if (evaluations.length === 0) return null;

    const totalScore = evaluations.reduce((sum, e) => sum + e.score, 0);
    const avgScore = (totalScore / evaluations.length).toFixed(1);

    // Collect all strengths and weaknesses
    const allStrengths = {};
    const allWeaknesses = {};
    const allMissingConcepts = {};

    evaluations.forEach((e) => {
      e.strengths?.forEach((s) => {
        allStrengths[s] = (allStrengths[s] || 0) + 1;
      });
      e.weaknesses?.forEach((w) => {
        allWeaknesses[w] = (allWeaknesses[w] || 0) + 1;
      });
      e.missingConcepts?.forEach((c) => {
        allMissingConcepts[c] = (allMissingConcepts[c] || 0) + 1;
      });
    });

    // Sort by frequency
    const sortByFrequency = (obj) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .map(([key]) => key);

    return {
      totalQuestions: questions.length,
      attempted: evaluations.length,
      avgScore,
      strongAreas: sortByFrequency(allStrengths).slice(0, 5),
      weakAreas: sortByFrequency(allWeaknesses).slice(0, 5),
      conceptsToRevise: sortByFrequency(allMissingConcepts).slice(0, 6),
    };
  };

  // Render the score circle
  const ScoreCircle = ({ score, size = "large" }) => {
    const getScoreColor = (s) => {
      if (s >= 8) return "#22c55e";
      if (s >= 6) return "#f59e0b";
      if (s >= 4) return "#f97316";
      return "#ef4444";
    };
    const color = getScoreColor(score);
    const isLarge = size === "large";

    return (
      <div
        className={`${isLarge ? "w-20 h-20" : "w-14 h-14"} rounded-full flex items-center justify-center border-4 flex-shrink-0`}
        style={{ borderColor: color }}
      >
        <span
          className={`${isLarge ? "text-2xl" : "text-lg"} font-bold`}
          style={{ color }}
        >
          {score}
        </span>
      </div>
    );
  };

  // ====== SETUP PHASE ======
  if (phase === "setup") {
    return (
      <DashboardLayout>
        <div className="container mx-auto pt-8 pb-8 px-4 md:px-0">
          <div className="max-w-xl mx-auto">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6 cursor-pointer transition-colors"
            >
              <LuArrowLeft /> Back to Dashboard
            </button>

            <div className="bg-white rounded-2xl shadow-xl shadow-orange-100/50 border border-orange-100/50 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#FF9324] to-[#e99a4b] p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <LuBrain className="text-2xl" />
                  <h2 className="text-xl font-bold">Mock Interview</h2>
                </div>
                <p className="text-white/80 text-sm">
                  Simulate a real interview — get AI-powered feedback on every
                  answer
                </p>
              </div>

              {/* Form */}
              <div className="p-7">
                <form
                  onSubmit={handleStartInterview}
                  className="flex flex-col gap-3"
                >
                  <Input
                    value={formData.role}
                    onChange={({ target }) =>
                      handleChange("role", target.value)
                    }
                    label="Target Role"
                    placeholder="(e.g., Frontend Developer, Backend Engineer)"
                    type="text"
                  />
                  <Input
                    value={formData.experience}
                    onChange={({ target }) =>
                      handleChange("experience", target.value)
                    }
                    label="Years of Experience"
                    placeholder="(e.g., 1 year, 3 years, 5+ years)"
                    type="number"
                  />
                  <Input
                    value={formData.topicsToFocus}
                    onChange={({ target }) =>
                      handleChange("topicsToFocus", target.value)
                    }
                    label="Topics to Focus On"
                    placeholder="(Comma-separated, e.g., React, Node.js, MongoDB)"
                    type="text"
                  />
                  <Input
                    value={formData.numberOfQuestions}
                    onChange={({ target }) =>
                      handleChange("numberOfQuestions", target.value)
                    }
                    label="Number of Questions"
                    placeholder="(e.g., 5, 10)"
                    type="number"
                  />

                  {formError && (
                    <p className="text-red-500 text-xs pb-1">{formError}</p>
                  )}

                  <button
                    type="submit"
                    className="btn-primary w-full mt-2"
                    disabled={isGenerating}
                  >
                    <LuSparkles className="text-lg" />
                    Start Interview
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ====== GENERATING PHASE ======
  if (phase === "generating") {
    return (
      <DashboardLayout>
        <div className="container mx-auto pt-20 pb-8 px-4 md:px-0">
          <div className="max-w-md mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl shadow-orange-100/50 border border-orange-100/50 p-10"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-[#FF9324] to-[#e99a4b] rounded-full flex items-center justify-center animate-pulse">
                  <LuBrain className="text-3xl text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Preparing Your Interview
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Generating {formData.numberOfQuestions} tailored questions for{" "}
                <span className="font-medium text-gray-700">
                  {formData.role}
                </span>
                ...
              </p>
              <SpinnerLoader />
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ====== INTERVIEW PHASE ======
  if (phase === "interview") {
    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
      <DashboardLayout>
        <div className="container mx-auto pt-6 pb-8 px-4 md:px-0">
          <div className="max-w-3xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-600">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-sm font-semibold text-gray-600">
                  {formData.role}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#FF9324] to-[#e99a4b] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-100/70 border border-gray-100/60 overflow-hidden">
                  {/* Question */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#FF9324] to-[#e99a4b] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white font-bold text-sm">
                          Q
                        </span>
                      </div>
                      <h3 className="text-[15px] font-medium text-gray-800 leading-relaxed">
                        {currentQuestion?.question}
                      </h3>
                    </div>
                  </div>

                  {/* Answer Area */}
                  <div className="p-6">
                    {!evaluation ? (
                      <>
                        <label className="text-[13px] text-slate-700 font-medium block mb-2">
                          Your Answer
                        </label>
                        <textarea
                          value={userAnswer}
                          onChange={(e) => {
                            setUserAnswer(e.target.value);
                            setAnswerError("");
                          }}
                          placeholder="Type your answer here... Be as detailed as you would in a real interview."
                          className="w-full min-h-[180px] text-sm text-gray-800 bg-gray-50/50 rounded-lg px-4 py-3 border border-gray-200 outline-none focus:border-orange-300 resize-y transition-colors"
                          disabled={isEvaluating}
                        />
                        {answerError && (
                          <p className="text-red-500 text-xs mt-2">
                            {answerError}
                          </p>
                        )}
                        <button
                          onClick={handleSubmitAnswer}
                          className="btn-primary w-full mt-4"
                          disabled={isEvaluating}
                        >
                          {isEvaluating ? (
                            <>
                              <SpinnerLoader /> Evaluating your answer...
                            </>
                          ) : (
                            <>
                              <LuSparkles className="text-lg" /> Submit Answer
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      /* Evaluation Results */
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        {/* Score */}
                        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                          <ScoreCircle score={evaluation.score} />
                          <div>
                            <p className="text-sm text-gray-500">Your Score</p>
                            <p className="text-2xl font-bold text-gray-800">
                              {evaluation.score}
                              <span className="text-gray-400 text-lg">
                                /10
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Strengths */}
                        {evaluation.strengths?.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <LuCircleCheck className="text-green-500" />
                              <h4 className="text-sm font-semibold text-gray-700">
                                Strengths
                              </h4>
                            </div>
                            <ul className="ml-6 space-y-1">
                              {evaluation.strengths.map((s, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-gray-600 list-disc"
                                >
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Weaknesses */}
                        {evaluation.weaknesses?.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <LuCircleAlert className="text-amber-500" />
                              <h4 className="text-sm font-semibold text-gray-700">
                                Weaknesses
                              </h4>
                            </div>
                            <ul className="ml-6 space-y-1">
                              {evaluation.weaknesses.map((w, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-gray-600 list-disc"
                                >
                                  {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Missing Concepts */}
                        {evaluation.missingConcepts?.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <LuLightbulb className="text-orange-500" />
                              <h4 className="text-sm font-semibold text-gray-700">
                                Missing Concepts
                              </h4>
                            </div>
                            <ul className="ml-6 space-y-1">
                              {evaluation.missingConcepts.map((c, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-gray-600 list-disc"
                                >
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Feedback */}
                        {evaluation.feedback && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <LuMessageSquare className="text-blue-500" />
                              <h4 className="text-sm font-semibold text-gray-700">
                                Feedback
                              </h4>
                            </div>
                            <p className="text-sm text-gray-600 ml-6 leading-relaxed">
                              {evaluation.feedback}
                            </p>
                          </div>
                        )}

                        {/* Ideal Answer */}
                        {evaluation.idealAnswer && (
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-2">
                              <LuTarget className="text-indigo-500" />
                              <h4 className="text-sm font-semibold text-gray-700">
                                Ideal Answer
                              </h4>
                            </div>
                            <div className="ml-6 bg-indigo-50/60 rounded-lg p-4 border border-indigo-100">
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {evaluation.idealAnswer}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Next Question Button */}
                        <button
                          onClick={handleNextQuestion}
                          className="btn-primary w-full mt-2"
                        >
                          {currentIndex + 1 >= questions.length ? (
                            <>
                              <LuTrophy className="text-lg" /> View Final Report
                            </>
                          ) : (
                            <>
                              Next Question{" "}
                              <LuChevronRight className="text-lg" />
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ====== SUMMARY PHASE ======
  if (phase === "summary") {
    const stats = getSummaryStats();

    return (
      <DashboardLayout>
        <div className="container mx-auto pt-6 pb-12 px-4 md:px-0">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Summary Header */}
              <div className="bg-gradient-to-r from-[#FF9324] to-[#e99a4b] rounded-2xl p-8 text-white mb-6 shadow-xl shadow-orange-200/50">
                <div className="flex items-center gap-3 mb-3">
                  <LuTrophy className="text-3xl" />
                  <h2 className="text-2xl font-bold">
                    Mock Interview Completed!
                  </h2>
                </div>
                <p className="text-white/80 text-sm">
                  {formData.role} — {formData.topicsToFocus}
                </p>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-white/20 rounded-xl p-4 text-center backdrop-blur-sm">
                    <p className="text-3xl font-bold">{stats?.avgScore}</p>
                    <p className="text-xs text-white/80 mt-1">
                      Average Score
                    </p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-4 text-center backdrop-blur-sm">
                    <p className="text-3xl font-bold">{stats?.attempted}</p>
                    <p className="text-xs text-white/80 mt-1">
                      Questions Attempted
                    </p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-4 text-center backdrop-blur-sm">
                    <p className="text-3xl font-bold">
                      {stats?.totalQuestions}
                    </p>
                    <p className="text-xs text-white/80 mt-1">
                      Total Questions
                    </p>
                  </div>
                </div>
              </div>

              {/* Strong Areas */}
              {stats?.strongAreas?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-100/70 border border-gray-100/60 p-6 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <LuCircleCheck className="text-green-500 text-lg" />
                    <h3 className="text-base font-semibold text-gray-800">
                      Strong Areas
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stats.strongAreas.map((area, i) => (
                      <span
                        key={i}
                        className="text-xs font-medium bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-100"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Needs Improvement */}
              {stats?.weakAreas?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-100/70 border border-gray-100/60 p-6 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <LuCircleAlert className="text-amber-500 text-lg" />
                    <h3 className="text-base font-semibold text-gray-800">
                      Needs Improvement
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stats.weakAreas.map((area, i) => (
                      <span
                        key={i}
                        className="text-xs font-medium bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-100"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Concepts to Revise */}
              {stats?.conceptsToRevise?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-100/70 border border-gray-100/60 p-6 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <LuLightbulb className="text-indigo-500 text-lg" />
                    <h3 className="text-base font-semibold text-gray-800">
                      Recommended Revision
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stats.conceptsToRevise.map((concept, i) => (
                      <span
                        key={i}
                        className="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-Question Breakdown */}
              <div className="bg-white rounded-2xl shadow-xl shadow-gray-100/70 border border-gray-100/60 p-6 mb-6">
                <h3 className="text-base font-semibold text-gray-800 mb-4">
                  Question-by-Question Breakdown
                </h3>
                <div className="space-y-3">
                  {evaluations.map((evalItem, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                    >
                      <ScoreCircle score={evalItem.score} size="small" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          Q{i + 1}: {evalItem.question}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Score: {evalItem.score}/10
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <LuArrowLeft /> Back to Dashboard
                </button>
                <button
                  onClick={() => {
                    setPhase("setup");
                    setQuestions([]);
                    setEvaluations([]);
                    setCurrentIndex(0);
                    setUserAnswer("");
                    setEvaluation(null);
                  }}
                  className="flex-1 btn-small"
                >
                  <LuBrain /> Start New Interview
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return null;
};

export default MockInterview;
