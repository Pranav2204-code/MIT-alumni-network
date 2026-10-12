/**
 * PointsLedger
 * ──────────────────────────────────────────────────────────
 * Immutable append-only ledger for all referral point moves.
 * Every earn, spend, refund, or admin adjustment is a
 * separate document here. The running balance on User is the
 * projection; this is the source of truth for audits.
 *
 * No document is ever deleted or updated — only inserted.
 * Refunds are a new +amount entry, not a reversal of the
 * original spend entry.
 */

const mongoose = require('mongoose');

const TRANSACTION_TYPES = Object.freeze({
  EARN_QUIZ:          'earn_quiz',
  EARN_CGPA:          'earn_cgpa',
  EARN_SIGNUP_BONUS:  'earn_signup_bonus',
  EARN_ADMIN:         'earn_admin',
  SPEND_REFERRAL:     'spend_referral',
  REFUND_REFERRAL:    'refund_referral',
  DEDUCT_ADMIN:       'deduct_admin',
});

const pointsLedgerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Signed integer: positive = earn, negative = spend/deduct
    amount: {
      type: Number,
      required: true,
    },

    // Balance AFTER this transaction (snapshot for fast auditing)
    balanceAfter: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
    },

    // Human-readable description
    description: {
      type: String,
      required: true,
    },

    // Optional reference to the triggering document
    refModel: {
      type: String,
      enum: ['QuizAttempt', 'ReferralRequest', null],
      default: null,
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Admin who performed manual adjustments
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    // Immutable: prevent accidental updates
    strict: true,
  }
);

// ── Compound index for user history queries ────────────────
pointsLedgerSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('PointsLedger', pointsLedgerSchema);
module.exports.TRANSACTION_TYPES = TRANSACTION_TYPES;
