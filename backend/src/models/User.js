/**
 * User
 * ──────────────────────────────────────────────────────────
 * Core user document. Links to a VerificationRecord via PRN.
 * Role is derived from graduationYear (past → Alumni, future
 * or current → Student) and is set at registration.
 *
 * referralPoints is the wallet balance. Every change to it
 * is also written to PointsLedger for full auditability.
 *
 * socialLinks are validated server-side using URL parsing
 * (not naive string.includes) to prevent injection tricks.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const socialLinksSchema = new mongoose.Schema(
  {
    linkedin:   { type: String, default: '' },
    github:     { type: String, default: '' },
    leetcode:   { type: String, default: '' },
    codeforces: { type: String, default: '' },
    hackerrank: { type: String, default: '' },
    portfolio:  { type: String, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // ── Identity & auth ───────────────────────────────────
    prn: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },

    role: {
      type: String,
      enum: ['student', 'alumni', 'admin'],
      required: true,
    },

    // Mirrors VerificationRecord for quick reads
    fullName:       { type: String, required: true, trim: true },
    department:     { type: String, required: true },
    graduationYear: { type: Number, required: true },
    degree:         { type: String, default: 'B.Tech' },

    // ── Profile ──────────────────────────────────────────
    avatar:     { type: String, default: '' },       // URL to uploaded image
    bio:        { type: String, default: '', maxlength: 500 },
    location:   { type: String, default: '' },
    jobTitle:   { type: String, default: '' },       // "Senior SWE"
    company:    { type: String, default: '' },       // "Google"
    techStack:  [{ type: String }],                  // ["React","Node.js","C++"]
    cgpa:       { type: Number, min: 0, max: 10 },   // self-reported, unverified
    cgpaVerified: { type: Boolean, default: false }, // true after admin verifies doc

    socialLinks: { type: socialLinksSchema, default: () => ({}) },

    isProfileComplete: { type: Boolean, default: false },

    // ── Points economy wallet ─────────────────────────────
    referralPoints: {
      type: Number,
      default: () => Number(process.env.INITIAL_REFERRAL_POINTS) || 2,
      min: 0,
    },

    // ── Account state ─────────────────────────────────────
    isVerified: { type: Boolean, default: false }, // admin-activated for alumni
    isActive:   { type: Boolean, default: true },

    // ── Password reset ────────────────────────────────────
    passwordResetToken:   { type: String, select: false },
    passwordResetExpires: { type: Date,   select: false },

    // Link back to VerificationRecord
    verificationRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VerificationRecord',
    },

    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ company: 1 });
userSchema.index({ department: 1 });
userSchema.index({ graduationYear: -1 });
userSchema.index({ referralPoints: -1 });

// ── Pre-save: hash password ───────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: compare password ─────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: check if profile is complete ─────────
userSchema.methods.checkProfileComplete = function () {
  const complete =
    !!this.bio && !!this.jobTitle && !!this.company && this.techStack.length > 0;
  this.isProfileComplete = complete;
  return complete;
};

// ── Transform: remove sensitive fields in JSON output ─────
userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
