const Session = require("../models/Session");
const Question = require("../models/Question");

// @desc    Create a new session and linked questions
// @route   POST /api/sessions/create
// @access  Private
exports.createSession = async (req, res) => {
  try {
    const {
      role,
      experience,
      topicsToFocus,
      description,
      numberOfQuestions,
      questions,
      mode,
    } = req.body;

    const userId = req.user._id;

    const session = await Session.create({
      user: userId,
      role,
      experience,
      topicsToFocus,
      description,
      numberOfQuestions: numberOfQuestions ? parseInt(numberOfQuestions) : undefined,
      mode: mode || "practice",
      status: "in_progress",
    });

    let questionDocs = [];
    if (questions && Array.isArray(questions)) {
      questionDocs = await Promise.all(
        questions.map(async (q) => {
          const question = await Question.create({
            session: session._id,
            question: q.question,
            answer: q.answer,
          });

          return question._id;
        })
      );
    }

    session.questions = questionDocs;
    await session.save();

    const populatedSession = await Session.findById(session._id).populate("questions");

    res.status(201).json({
      success: true,
      session: populatedSession,
    });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// @desc    Get all sessions for the logged in user
// @route   GET /api/sessions/my-sessions
// @access  Private
exports.getMySessions = async (req, res) => {
  try {
    const sessions=await Session.find({user :req.user.id})
    .sort({createdAt:-1})
    .populate("questions");
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// @desc    Get a session by id with populated questions
// @route   GET /api/sessions/:id
// @access  Private
exports.getSessionById = async (req, res) => {
  try {
    const session=await Session.findById(req.params.id)
    .populate({
        path:"questions",
        options:{sort:{isPinned:-1,createdAt:-1}},
    })
    .exec();
    if(!session){
        return res.status(400)
        .json({sucess:false,message:"Session not found"});
    }
    res.status(200).json({sucess:true,session});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// @desc    Complete a session and update overall score
// @route   PATCH /api/sessions/:id/complete
// @access  Private
exports.completeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Check ownership
    const userId = req.user._id ? req.user._id.toString() : req.user.id ? req.user.id.toString() : "";
    if (session.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to modify this session" });
    }

    const { overallScore } = req.body;

    session.status = "completed";
    if (overallScore !== undefined && overallScore !== null) {
      session.overallScore = parseFloat(overallScore);
    }
    await session.save();

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Complete session error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// @desc    Delete a session
// @route   DELETE /api/sessions/:id
// @access  Private
exports.deleteSession = async (req, res) => {
  try {
    const session=await Session.findById(req.params.id);
    if(!session){
        return res.status(404).json({message:"Session not found"});
    }
    ///check if the loggged in user owns thi ssession
    if(session.user.toString()!=req.user.id){
        return res.status(401).json({message:"Not authorized to delete this session"});
    }
    ///first delete questions
    await Question.deleteMany({session:session._id});

    //then delete session
    await session.deleteOne();
    res.status(200).json({message:"Session deleted Successfully"});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};