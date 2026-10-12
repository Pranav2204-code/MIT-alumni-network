/**
 * Job
 * ──────────────────────────────────────────────────────────
 * Job postings created by verified alumni.
 * Students spend referral points to request a referral
 * against a specific job listing.
 */

const mongoose = require('mongoose');

const JOB_TYPES   = ['full-time', 'part-time', 'internship', 'contract', 'freelance'];
const JOB_DOMAINS = [
  'Software Engineering', 'Data Science / ML', 'Cyber Security',
  'DevOps / Cloud', 'Product Management', 'Design', 'Finance',
  'Consulting', 'Research', 'Other',
];

const jobSchema = new mongoose.Schema(
  {
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title:       { type: String, required: true, trim: true, maxlength: 120 },
    company:     { type: String, required: true, trim: true },
    location:    { type: String, required: true, trim: true },
    isRemote:    { type: Boolean, default: false },

    jobType: {
      type: String,
      enum: JOB_TYPES,
      required: true,
    },

    domain: {
      type: String,
      enum: JOB_DOMAINS,
      required: true,
    },

    description: { type: String, required: true, maxlength: 3000 },
    requirements:{ type: String, maxlength: 2000 },

    // Salary range in INR (optional)
    salaryMin: { type: Number },
    salaryMax: { type: Number },

    // Skills the alumni is specifically looking for
    skillsRequired: [{ type: String }],

    // Max number of referral requests alumni is willing to review
    referralSlots: { type: Number, default: 5, min: 1, max: 20 },

    // How many referral requests have been accepted/pending
    referralsFilled: { type: Number, default: 0 },

    // Application deadline
    deadline: { type: Date },

    // External ATS / company job link (optional, for context)
    externalLink: { type: String, default: '' },

    isActive: { type: Boolean, default: true, index: true },

    // Soft-delete flag
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────
jobSchema.index({ isActive: 1, createdAt: -1 });
jobSchema.index({ domain: 1, jobType: 1 });
jobSchema.index({ company: 1 });

// ── Virtual: referral availability ───────────────────────
jobSchema.virtual('hasSlotsAvailable').get(function () {
  return this.referralsFilled < this.referralSlots;
});

module.exports = mongoose.model('Job', jobSchema);
module.exports.JOB_TYPES   = JOB_TYPES;
module.exports.JOB_DOMAINS = JOB_DOMAINS;
