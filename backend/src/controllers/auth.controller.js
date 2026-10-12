const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const VerificationRecord = require('../models/VerificationRecord');
const User = require('../models/User');
const PointsLedger = require('../models/PointsLedger');
const { TRANSACTION_TYPES } = require('../models/PointsLedger');
const { sendTokenResponse } = require('../utils/jwt.utils');

/**
 * POST /api/v1/auth/verify-prn
 * Step 1 of registration: verify PRN + name + DOB against the
 * university seed database. Returns a temporary verification
 * token on success (passed to step 2 in the same session).
 */
async function verifyPrn(req, res) {
  const { prn, fullName, dob } = req.body;

  // Fetch with dobHash (select: false field)
  const record = await VerificationRecord.findOne({ prn: prn.toUpperCase() })
    .select('+dobHash');

  if (!record) {
    return res.status(404).json({ message: 'PRN not found in university records.' });
  }

  if (record.claimed) {
    return res.status(409).json({ message: 'An account already exists for this PRN.' });
  }

  // Name match (case-insensitive, trimmed)
  const nameMatch =
    record.fullName.toLowerCase().trim() === fullName.toLowerCase().trim();
  if (!nameMatch) {
    return res.status(400).json({ message: 'Name does not match university records.' });
  }

  // DOB match against stored hash
  const dobMatch = await bcrypt.compare(dob, record.dobHash);
  if (!dobMatch) {
    return res.status(400).json({ message: 'Date of birth does not match.' });
  }

  // Return enough data for step 2 (no sensitive fields)
  return res.json({
    success: true,
    message: 'PRN verified successfully.',
    verificationData: {
      prn:            record.prn,
      fullName:       record.fullName,
      department:     record.department,
      degree:         record.degree,
      graduationYear: record.graduationYear,
    },
  });
}

/**
 * POST /api/v1/auth/register
 * Step 2: create the actual user account.
 * Receives the PRN (verified in step 1), email, and password.
 */
async function register(req, res) {
  const { prn, email, password } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Re-validate PRN claim status (prevent race conditions)
    const record = await VerificationRecord.findOne({ prn: prn.toUpperCase() })
      .session(session);

    if (!record) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'PRN not found.' });
    }
    if (record.claimed) {
      await session.abortTransaction();
      return res.status(409).json({ message: 'An account already exists for this PRN.' });
    }

    // Check email uniqueness
    const existingEmail = await User.findOne({ email: email.toLowerCase() }).session(session);
    if (existingEmail) {
      await session.abortTransaction();
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Determine role from graduation year
    const currentYear = new Date().getFullYear();
    const role = record.graduationYear <= currentYear ? 'alumni' : 'student';

    // Check if this PRN should be admin
    const adminPrns = (process.env.ADMIN_PRNS || '').split(',').map(p => p.trim().toUpperCase());
    const finalRole = adminPrns.includes(record.prn) ? 'admin' : role;

    const initialPoints = Number(process.env.INITIAL_REFERRAL_POINTS) || 2;

    // Create user
    const [newUser] = await User.create(
      [{
        prn: record.prn,
        email: email.toLowerCase(),
        password,
        role: finalRole,
        fullName: record.fullName,
        department: record.department,
        degree: record.degree,
        graduationYear: record.graduationYear,
        referralPoints: initialPoints,
        verificationRecord: record._id,
        isVerified: finalRole === 'student', // students auto-verified; alumni pending admin review
      }],
      { session }
    );

    // Mark PRN as claimed
    await VerificationRecord.findByIdAndUpdate(
      record._id,
      { claimed: true, claimedBy: newUser._id, claimedAt: new Date() },
      { session }
    );

    // Write signup bonus to ledger
    await PointsLedger.create(
      [{
        user: newUser._id,
        amount: initialPoints,
        balanceAfter: initialPoints,
        type: TRANSACTION_TYPES.EARN_SIGNUP_BONUS,
        description: `Welcome bonus on registration`,
      }],
      { session }
    );

    await session.commitTransaction();

    sendTokenResponse(res, newUser, 201);
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * POST /api/v1/auth/login
 */
async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: 'Account has been deactivated.' });
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(res, user);
}

/**
 * POST /api/v1/auth/logout
 */
function logout(_req, res) {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.json({ success: true, message: 'Logged out successfully.' });
}

/**
 * GET /api/v1/auth/me
 */
async function getMe(req, res) {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: { user } });
}

module.exports = { verifyPrn, register, login, logout, getMe };
