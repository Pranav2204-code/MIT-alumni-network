/**
 * Points utility functions
 * ──────────────────────────────────────────────────────────
 * All point mutations go through these helpers to guarantee:
 *   1. Atomic MongoDB $inc (no race conditions)
 *   2. Ledger entry created in the same operation
 *   3. Balance never goes below 0
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const PointsLedger = require('../models/PointsLedger');
const { TRANSACTION_TYPES } = require('../models/PointsLedger');

/**
 * Atomically add points to a user's wallet and record in ledger.
 * @param {string|ObjectId} userId
 * @param {number} amount - positive integer
 * @param {string} type - from TRANSACTION_TYPES
 * @param {string} description
 * @param {object} opts - { refModel, refId, performedBy, session }
 * @returns {PointsLedger} the created ledger entry
 */
async function awardPoints(userId, amount, type, description, opts = {}) {
  const { refModel = null, refId = null, performedBy = null, session } = opts;

  if (amount <= 0) throw new Error('Award amount must be positive');

  // Atomic increment
  const updated = await User.findByIdAndUpdate(
    userId,
    { $inc: { referralPoints: amount } },
    { new: true, session }
  );

  if (!updated) throw new Error('User not found');

  const ledgerEntry = await PointsLedger.create(
    [{
      user: userId,
      amount,
      balanceAfter: updated.referralPoints,
      type,
      description,
      refModel,
      refId,
      performedBy,
    }],
    { session }
  );

  return ledgerEntry[0];
}

/**
 * Atomically spend points. Returns null if insufficient balance.
 * Uses conditional update to prevent negative balance race conditions.
 */
async function spendPoints(userId, amount, type, description, opts = {}) {
  const { refModel = null, refId = null, session } = opts;

  if (amount <= 0) throw new Error('Spend amount must be positive');

  // Conditional update: only succeeds if balance >= amount
  const updated = await User.findOneAndUpdate(
    { _id: userId, referralPoints: { $gte: amount } },
    { $inc: { referralPoints: -amount } },
    { new: true, session }
  );

  if (!updated) return null; // insufficient balance

  const ledgerEntry = await PointsLedger.create(
    [{
      user: userId,
      amount: -amount,
      balanceAfter: updated.referralPoints,
      type,
      description,
      refModel,
      refId,
    }],
    { session }
  );

  return { ledgerEntry: ledgerEntry[0], newBalance: updated.referralPoints };
}

/**
 * Get a user's points history (paginated).
 */
async function getPointsHistory(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [entries, total] = await Promise.all([
    PointsLedger.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PointsLedger.countDocuments({ user: userId }),
  ]);

  return { entries, total, page, pages: Math.ceil(total / limit) };
}

module.exports = { awardPoints, spendPoints, getPointsHistory };
