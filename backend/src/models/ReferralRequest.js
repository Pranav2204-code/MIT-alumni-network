/**
 * ReferralRequest
 * ──────────────────────────────────────────────────────────
 * Created when a student spends 1 referral point to request
 * a referral from an alumni for a specific job.
 *
 * State machine:
 *   pending → accepted  (alumni agrees to refer)
 *          → declined   (alumni declines → point refunded)
 *          → expired    (auto-expired after 14 days → point refunded)
 *
 * The point deduction happens atomically in the controller
 * using a conditional $inc to prevent race conditions.
 */

const mongoose = require('mongoose');

const STATUSES = Object.freeze({
  PENDING:  'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED:  'expired',
});

const EXPIRY_DAYS = 14;

const referralRequestSchema = new mongoose.Schema(
  {
    // Student who sent the request (spent a point)
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Alumni who received the request
    requestedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // The specific job this referral is for
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(STATUSES),
      default: STATUSES.PENDING,
      index: true,
    },

    // Student's personal message to the alumni
    message: {
      type: String,
      maxlength: 500,
      default: '',
    },

    // Alumni's response note (when accepting or declining)
    responseNote: {
      type: String,
      maxlength: 300,
      default: '',
    },

    // Point tracking for potential refund
    pointsSpent: { type: Number, default: 1 },
    pointsRefunded: { type: Boolean, default: false },

    // Ledger entry references for traceability
    spendLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PointsLedger',
    },
    refundLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PointsLedger',
      default: null,
    },

    // Auto-expiry date
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      index: true,
    },

    respondedAt: { type: Date },
  },
  { timestamps: true }
);

// ── Compound indexes ──────────────────────────────────────
referralRequestSchema.index({ requestedBy: 1, job: 1 }, { unique: true }); // one request per job
referralRequestSchema.index({ requestedFrom: 1, status: 1 });
referralRequestSchema.index({ status: 1, expiresAt: 1 });  // for expiry cron

module.exports = mongoose.model('ReferralRequest', referralRequestSchema);
module.exports.STATUSES     = STATUSES;
module.exports.EXPIRY_DAYS  = EXPIRY_DAYS;
