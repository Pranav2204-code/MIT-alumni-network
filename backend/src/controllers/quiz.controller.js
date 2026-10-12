const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Notification = require('../models/Notification');
const { NOTIFICATION_TYPES } = require('../models/Notification');
const { awardPoints } = require('../utils/points.utils');
const { TRANSACTION_TYPES } = require('../models/PointsLedger');

/**
 * GET /api/v1/quizzes
 * Lists available quizzes. Questions and correct answers are
 * NOT included (use getQuizForAttempt for that).
 */
async function listQuizzes(req, res) {
  const quizzes = await Quiz.find({ isActive: true })
    .select('-questions.correctIndex -questions.explanation')
    .sort({ category: 1 });

  // For each quiz, attach this user's last attempt info
  const userId = req.user._id;
  const attempts = await QuizAttempt.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  const attemptMap = {};
  for (const attempt of attempts) {
    const key = attempt.quiz.toString();
    if (!attemptMap[key]) attemptMap[key] = attempt; // keep latest
  }

  const quizzesWithStatus = quizzes.map((quiz) => {
    const quizObj = quiz.toObject();
    const lastAttempt = attemptMap[quiz._id.toString()];
    quizObj.questionCount = quiz.questions.length;
    delete quizObj.questions; // don't send question details in list view

    if (lastAttempt) {
      const now = new Date();
      const cooldownActive = lastAttempt.cooldownUntil > now;
      quizObj.lastAttempt = {
        score:          lastAttempt.score,
        passed:         lastAttempt.passed,
        pointsAwarded:  lastAttempt.pointsAwarded,
        attemptedAt:    lastAttempt.createdAt,
        cooldownActive,
        cooldownUntil:  lastAttempt.cooldownUntil,
      };
    }
    return quizObj;
  });

  res.json({ success: true, data: { quizzes: quizzesWithStatus } });
}

/**
 * GET /api/v1/quizzes/:id/attempt
 * Returns quiz with questions and options but WITHOUT correct
 * answers (correctIndex has select: false). Client starts attempt.
 */
async function getQuizForAttempt(req, res) {
  // Check cooldown first
  const lastAttempt = await QuizAttempt.findOne({
    user: req.user._id,
    quiz: req.params.id,
  }).sort({ createdAt: -1 });

  if (lastAttempt && lastAttempt.cooldownUntil > new Date()) {
    return res.status(429).json({
      message: 'Quiz is in cooldown.',
      cooldownUntil: lastAttempt.cooldownUntil,
    });
  }

  const quiz = await Quiz.findById(req.params.id)
    .select('-questions.correctIndex -createdBy'); // strip answers

  if (!quiz || !quiz.isActive) {
    return res.status(404).json({ message: 'Quiz not found.' });
  }

  res.json({ success: true, data: { quiz } });
}

/**
 * POST /api/v1/quizzes/:id/submit
 * Server-side grading. Answers are compared against stored
 * correctIndex values. Points are awarded if passed.
 */
async function submitQuiz(req, res) {
  const { answers, timeTakenSeconds } = req.body;
  const userId = req.user._id;

  // 1. Check cooldown
  const lastAttempt = await QuizAttempt.findOne({
    user: userId,
    quiz: req.params.id,
  }).sort({ createdAt: -1 });

  if (lastAttempt && lastAttempt.cooldownUntil > new Date()) {
    return res.status(429).json({
      message: 'You must wait before attempting this quiz again.',
      cooldownUntil: lastAttempt.cooldownUntil,
    });
  }

  // 2. Fetch quiz WITH correct answers (server-side only)
  const quiz = await Quiz.findById(req.params.id).select('+questions.correctIndex');
  if (!quiz || !quiz.isActive) {
    return res.status(404).json({ message: 'Quiz not found.' });
  }

  if (answers.length !== quiz.questions.length) {
    return res.status(400).json({
      message: `Expected ${quiz.questions.length} answers, got ${answers.length}.`,
    });
  }

  // 3. Grade server-side
  let correctCount = 0;
  const gradedAnswers = quiz.questions.map((q, i) => {
    const isCorrect = answers[i] === q.correctIndex;
    if (isCorrect) correctCount++;
    return {
      questionId:    q._id,
      selectedIndex: answers[i],
      isCorrect,
    };
  });

  const score = Math.round((correctCount / quiz.questions.length) * 100);
  const passed = score >= quiz.passScore;

  // 4. Determine if points should be awarded
  // Award points only on first passing attempt per cooldown window
  let pointsAwarded = 0;
  let ledgerId = null;

  if (passed) {
    // Check if there's a previous attempt that already awarded points
    // in the last cooldown window
    const previousPassingAttempt = await QuizAttempt.findOne({
      user:   userId,
      quiz:   req.params.id,
      passed: true,
      pointsAwarded: { $gt: 0 },
    }).sort({ createdAt: -1 });

    const shouldAward = !previousPassingAttempt ||
      new Date() - previousPassingAttempt.createdAt > QuizAttempt.COOLDOWN_HOURS * 60 * 60 * 1000;

    if (shouldAward) {
      pointsAwarded = quiz.pointsAwarded;
      const ledgerEntry = await awardPoints(
        userId, pointsAwarded,
        TRANSACTION_TYPES.EARN_QUIZ,
        `Passed "${quiz.title}" with ${score}% — +${pointsAwarded} point`,
        { refModel: 'QuizAttempt', refId: null }
      );
      ledgerId = ledgerEntry._id;

      // Notify user
      await Notification.create({
        recipient: userId,
        type:      NOTIFICATION_TYPES.POINTS_EARNED,
        title:     `+${pointsAwarded} Referral Point Earned! 🏆`,
        message:   `You passed "${quiz.title}" with ${score}%. Keep going!`,
        actionUrl: `/wallet`,
      });
    }
  }

  // 5. Save attempt
  const attempt = await QuizAttempt.create({
    user:             userId,
    quiz:             quiz._id,
    answers:          gradedAnswers,
    totalQuestions:   quiz.questions.length,
    correctAnswers:   correctCount,
    score,
    passed,
    pointsAwarded,
    timeTakenSeconds: timeTakenSeconds || 0,
    ledgerId,
  });

  // 6. Return result with explanations (now safe to reveal)
  const questionsWithExplanations = quiz.questions.map((q, i) => ({
    text:          q.text,
    options:       q.options,
    correctIndex:  q.correctIndex,
    selectedIndex: answers[i],
    isCorrect:     gradedAnswers[i].isCorrect,
    explanation:   q.explanation,
    difficulty:    q.difficulty,
  }));

  res.json({
    success: true,
    data: {
      attempt: {
        id:            attempt._id,
        score,
        passed,
        correctAnswers: correctCount,
        totalQuestions: quiz.questions.length,
        pointsAwarded,
        cooldownUntil: attempt.cooldownUntil,
      },
      questions: questionsWithExplanations,
    },
  });
}

/**
 * GET /api/v1/quizzes/my-attempts
 */
async function getMyAttempts(req, res) {
  const attempts = await QuizAttempt.find({ user: req.user._id })
    .populate('quiz', 'title category')
    .select('-answers')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: { attempts } });
}

module.exports = { listQuizzes, getQuizForAttempt, submitQuiz, getMyAttempts };
