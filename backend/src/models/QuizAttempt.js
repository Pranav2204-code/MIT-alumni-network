/**
 * QuizAttempt
 * ──────────────────────────────────────────────────────────
 * Records every quiz attempt by a student, including:
 *   - The answers they submitted
 *   - Their score
 *   - Whether they passed and earned points
 *   - Cooldown enforcement (only 1 attempt per quiz per week)
 *
 * One attempt per quiz per cooldown window (default 168h).
 * The unique index { user + quiz } is not globally unique
 * because we allow re-attempts after the cooldown. The
 * cooldown is enforced in the controller.
 */

const mongoose = require('mongoose');

const COOLDOWN_HOURS = Number(process.env.QUIZ_COOLDOWN_HOURS) || 168; // 7 days

const answerSchema = new mongoose.Schema(
  {
    questionId:    { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedIndex: { type: Number, required: true },
    isCorrect:     { type: Boolean, required: true },
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      index: true,
    },

    answers: [answerSchema],

    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },

    // Percentage score 0-100
    score: { type: Number, required: true },

    passed: { type: Boolean, required: true },

    // Did this attempt actually award points?
    // (passes after the first passing attempt in a window do not re-award)
    pointsAwarded: { type: Number, default: 0 },

    // Cooldown: next attempt allowed after this timestamp
    cooldownUntil: {
      type: Date,
      default: () => new Date(Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000),
      index: true,
    },

    // Time taken in seconds
    timeTakenSeconds: { type: Number },

    ledgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PointsLedger',
      default: null,
    },
  },
  { timestamps: true }
);

// ── Index: find latest attempt by user+quiz quickly ───────
quizAttemptSchema.index({ user: 1, quiz: 1, createdAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
module.exports.COOLDOWN_HOURS = COOLDOWN_HOURS;
