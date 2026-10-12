/**
 * Notification
 * ──────────────────────────────────────────────────────────
 * In-app notifications for key events:
 *   - Alumni: new referral request received
 *   - Student: referral request accepted / declined / expired
 *   - Student: quiz points earned
 *   - User: profile verification approved by admin
 */

const mongoose = require('mongoose');

const NOTIFICATION_TYPES = Object.freeze({
  REFERRAL_REQUEST_RECEIVED:  'referral_request_received',
  REFERRAL_REQUEST_ACCEPTED:  'referral_request_accepted',
  REFERRAL_REQUEST_DECLINED:  'referral_request_declined',
  REFERRAL_REQUEST_EXPIRED:   'referral_request_expired',
  POINTS_EARNED:              'points_earned',
  POINTS_REFUNDED:            'points_refunded',
  PROFILE_VERIFIED:           'profile_verified',
  NEW_JOB_IN_DOMAIN:          'new_job_in_domain',
});

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
    },

    title:   { type: String, required: true },
    message: { type: String, required: true },

    // Optional deep-link inside the app
    actionUrl: { type: String, default: '' },

    isRead: { type: Boolean, default: false, index: true },

    // Reference to the triggering document (polymorphic)
    refModel: {
      type: String,
      enum: ['ReferralRequest', 'Job', 'Quiz', null],
      default: null,
    },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

// ── Compound index for inbox queries ──────────────────────
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// ── TTL index: auto-delete notifications after 90 days ────
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
