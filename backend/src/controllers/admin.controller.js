const User = require('../models/User');
const VerificationRecord = require('../models/VerificationRecord');
const Quiz = require('../models/Quiz');
const ReferralRequest = require('../models/ReferralRequest');
const PointsLedger = require('../models/PointsLedger');
const { TRANSACTION_TYPES } = require('../models/PointsLedger');
const { awardPoints } = require('../utils/points.utils');

// ─── Users ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/users
 * Paginated list of all users with filters.
 */
async function listUsers(req, res) {
  const { role, isVerified, isActive, search, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (role)      filter.role = role;
  if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
  if (isActive   !== undefined) filter.isActive   = isActive   === 'true';
  if (search) {
    filter.$or = [
      { fullName: new RegExp(search, 'i') },
      { email:    new RegExp(search, 'i') },
      { prn:      new RegExp(search, 'i') },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('fullName email prn role department graduationYear isVerified isActive referralPoints createdAt lastLoginAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
}

/**
 * PATCH /api/v1/admin/users/:id/verify
 * Approve or reject an alumni's profile.
 */
async function verifyUser(req, res) {
  const { isVerified } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isVerified },
    { new: true }
  ).select('fullName email prn role isVerified');

  if (!user) return res.status(404).json({ message: 'User not found.' });

  res.json({
    success: true,
    message: `User ${isVerified ? 'verified' : 'unverified'} successfully.`,
    data: { user },
  });
}

/**
 * PATCH /api/v1/admin/users/:id/toggle-active
 * Suspend or reinstate a user account.
 */
async function toggleUserActive(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: `User account ${user.isActive ? 'reinstated' : 'suspended'}.`,
    data: { userId: user._id, isActive: user.isActive },
  });
}

/**
 * POST /api/v1/admin/users/:id/award-points
 * Manually award or deduct points.
 */
async function adminAwardPoints(req, res) {
  const { amount, description } = req.body;
  if (!amount || !description) {
    return res.status(400).json({ message: 'amount and description are required.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const type = amount > 0 ? TRANSACTION_TYPES.EARN_ADMIN : TRANSACTION_TYPES.DEDUCT_ADMIN;
  const ledger = await awardPoints(user._id, amount, type, description, {
    performedBy: req.user._id,
  });

  res.json({
    success: true,
    message: `${Math.abs(amount)} point(s) ${amount > 0 ? 'awarded' : 'deducted'}.`,
    data: { ledger },
  });
}

// ─── Quizzes ─────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/admin/quizzes – create a quiz
 */
async function createQuiz(req, res) {
  const quiz = await Quiz.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: { quiz } });
}

/**
 * PATCH /api/v1/admin/quizzes/:id – update quiz
 */
async function updateQuiz(req, res) {
  const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
  res.json({ success: true, data: { quiz } });
}

/**
 * DELETE /api/v1/admin/quizzes/:id – deactivate quiz
 */
async function deleteQuiz(req, res) {
  const quiz = await Quiz.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
  res.json({ success: true, message: 'Quiz deactivated.' });
}

// ─── Verification Records ────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/verification-records
 */
async function listVerificationRecords(req, res) {
  const { claimed, department, graduationYear, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (claimed       !== undefined) filter.claimed       = claimed === 'true';
  if (department)                  filter.department    = department;
  if (graduationYear)              filter.graduationYear = Number(graduationYear);

  const skip = (Number(page) - 1) * Number(limit);
  const [records, total] = await Promise.all([
    VerificationRecord.find(filter)
      .populate('claimedBy', 'fullName email')
      .sort({ graduationYear: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    VerificationRecord.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { records, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/admin/stats – platform dashboard stats
 */
async function getPlatformStats(req, res) {
  const [
    totalUsers, totalAlumni, totalStudents,
    pendingVerifications, totalReferrals,
    acceptedReferrals, totalPointsIssued,
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'alumni', isActive: true }),
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'alumni', isVerified: false, isActive: true }),
    ReferralRequest.countDocuments(),
    ReferralRequest.countDocuments({ status: 'accepted' }),
    PointsLedger.aggregate([
      { $match: { amount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      users: { total: totalUsers, alumni: totalAlumni, students: totalStudents },
      verifications: { pending: pendingVerifications },
      referrals: { total: totalReferrals, accepted: acceptedReferrals },
      points: { totalIssued: totalPointsIssued[0]?.total || 0 },
    },
  });
}

module.exports = {
  listUsers,
  verifyUser,
  toggleUserActive,
  adminAwardPoints,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  listVerificationRecords,
  getPlatformStats,
};
