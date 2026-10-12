/**
 * VerificationRecord
 * ──────────────────────────────────────────────────────────
 * Seeded from the university's official graduate database
 * (CSV/Excel supplied by admin). This is the single source
 * of truth for "is this person a real MIT-WPU graduate?"
 *
 * A PRN can only be claimed once. Once claimed, no one else
 * can register with that PRN.
 *
 * DOB is stored as a bcrypt hash for privacy – it is never
 * retrieved in plaintext, only compared at registration time.
 */

const mongoose = require('mongoose');

const verificationRecordSchema = new mongoose.Schema(
  {
    prn: {
      type: String,
      required: [true, 'PRN is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },

    // e.g. "Computer Science and Engineering - Cyber Security and Forensics"
    department: {
      type: String,
      required: true,
      trim: true,
    },

    // e.g. "B.Tech", "MBA", "LLB"
    degree: {
      type: String,
      required: true,
      default: 'B.Tech',
    },

    graduationYear: {
      type: Number,
      required: true,
    },

    // bcrypt hash of YYYY-MM-DD string – never stored in plaintext
    dobHash: {
      type: String,
      required: [true, 'Date of birth is required for verification'],
      select: false, // never returned in queries by default
    },

    // Set to true once a user account is created against this PRN
    claimed: {
      type: Boolean,
      default: false,
    },

    // Reference to the User doc once claimed
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    claimedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for the verification lookup
verificationRecordSchema.index({ prn: 1, claimed: 1 });

module.exports = mongoose.model('VerificationRecord', verificationRecordSchema);
