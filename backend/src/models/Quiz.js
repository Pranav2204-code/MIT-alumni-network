/**
 * Quiz
 * ──────────────────────────────────────────────────────────
 * A quiz has many questions. Questions and correct answers
 * live ONLY on the server — never sent to the client until
 * grading happens. The client only receives question text
 * and options.
 *
 * Grading is 100% server-side. The client submits answer
 * indices; the server compares against correctIndex values
 * stored here.
 */

const mongoose = require('mongoose');

const CATEGORIES = [
  'Data Structures & Algorithms',
  'Operating Systems',
  'Computer Networks',
  'Cyber Security',
  'Database Management',
  'Web Development',
  'Cloud & DevOps',
  'Object Oriented Programming',
  'System Design',
  'Aptitude & Reasoning',
];

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },

    // 4 options rendered to the user
    options: {
      type: [String],
      validate: [(arr) => arr.length === 4, 'Exactly 4 options required'],
    },

    // Index of the correct option (0-3) — select: false keeps it server-only
    correctIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
      select: false,
    },

    explanation: { type: String, default: '' }, // shown after quiz is graded
    difficulty:  { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    category:    { type: String, enum: CATEGORIES, required: true, index: true },
    description: { type: String, default: '' },

    // How many minutes the student gets
    timeLimitMinutes: { type: Number, default: 20, min: 5, max: 120 },

    questions: {
      type: [questionSchema],
      validate: [(arr) => arr.length >= 5, 'At least 5 questions required'],
    },

    // Pass threshold 0-100 (default from env, fallback 80)
    passScore: {
      type: Number,
      default: () => Number(process.env.QUIZ_PASS_SCORE) || 80,
    },

    // Points awarded for passing
    pointsAwarded: {
      type: Number,
      default: () => Number(process.env.POINTS_PER_QUIZ_PASS) || 1,
    },

    isActive:   { type: Boolean, default: true, index: true },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
module.exports.CATEGORIES = CATEGORIES;
