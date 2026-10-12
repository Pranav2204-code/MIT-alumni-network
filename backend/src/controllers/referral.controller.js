const mongoose = require('mongoose');
const ReferralRequest = require('../models/ReferralRequest');
const { STATUSES } = require('../models/ReferralRequest');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const { NOTIFICATION_TYPES } = require('../models/Notification');
const { spendPoints, awardPoints } = require('../utils/points.utils');
const { TRANSACTION_TYPES } = require('../models/PointsLedger');

/**
 * POST /api/v1/referrals
 * Student requests a referral for a job. Costs 1 point.
 * The point deduction is atomic — if MongoDB rejects due to
 * insufficient balance, no request is created.
 */
async function createReferralRequest(req, res) {
  const { jobId, message } = req.body;
  const studentId = req.user._id;

  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can request referrals.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate job exists and has slots
    const job = await Job.findById(jobId).populate('postedBy', 'fullName').session(session);
    if (!job || !job.isActive) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Job not found or no longer active.' });
    }
    if (!job.hasSlotsAvailable) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'No referral slots available for this job.' });
    }
    if (job.postedBy._id.equals(studentId)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'You cannot request a referral for your own job post.' });
    }

    // Prevent duplicate requests for the same job
    const existing = await ReferralRequest.findOne({
      requestedBy: studentId,
      job: jobId,
    }).session(session);
    if (existing) {
      await session.abortTransaction();
      return res.status(409).json({
        message: 'You have already sent a referral request for this job.',
      });
    }

    // Atomically spend 1 point (returns null if balance insufficient)
    const spendResult = await spendPoints(
      studentId, 1,
      TRANSACTION_TYPES.SPEND_REFERRAL,
      `Referral request to ${job.postedBy.fullName} for ${job.title} at ${job.company}`,
      { refModel: 'Job', refId: job._id, session }
    );

    if (!spendResult) {
      await session.abortTransaction();
      return res.status(400).json({
        message: 'Insufficient referral points. Earn more by completing quizzes.',
      });
    }

    // Create the referral request
    const [request] = await ReferralRequest.create(
      [{
        requestedBy:   studentId,
        requestedFrom: job.postedBy._id,
        job:           jobId,
        message:       message || '',
        spendLedgerId: spendResult.ledgerEntry._id,
      }],
      { session }
    );

    // Increment job's referralsFilled counter
    await Job.findByIdAndUpdate(jobId, { $inc: { referralsFilled: 1 } }, { session });

    // Notify the alumni
    await Notification.create(
      [{
        recipient: job.postedBy._id,
        type:      NOTIFICATION_TYPES.REFERRAL_REQUEST_RECEIVED,
        title:     'New Referral Request',
        message:   `${req.user.fullName} has requested a referral for ${job.title} at ${job.company}.`,
        actionUrl: `/referrals/${request._id}`,
        refModel:  'ReferralRequest',
        refId:     request._id,
      }],
      { session }
    );

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: '1 referral point spent. Request sent to alumni.',
      data: {
        request,
        newBalance: spendResult.newBalance,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * PATCH /api/v1/referrals/:id/respond
 * Alumni responds to a referral request (accept or decline).
 */
async function respondToReferral(req, res) {
  const { status, responseNote } = req.body;
  const alumniId = req.user._id;

  if (!['accepted', 'declined'].includes(status)) {
    return res.status(400).json({ message: 'Status must be "accepted" or "declined".' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const request = await ReferralRequest.findOne({
      _id:           req.params.id,
      requestedFrom: alumniId,
      status:        STATUSES.PENDING,
    }).populate('job', 'title company').session(session);

    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Pending referral request not found.' });
    }

    request.status      = status;
    request.responseNote = responseNote || '';
    request.respondedAt = new Date();

    // Refund the point if declined
    if (status === 'declined' && !request.pointsRefunded) {
      const ledgerEntry = await awardPoints(
        request.requestedBy, 1,
        TRANSACTION_TYPES.REFUND_REFERRAL,
        `Refund: alumni declined referral for ${request.job.title}`,
        { refModel: 'ReferralRequest', refId: request._id, session }
      );
      request.pointsRefunded = true;
      request.refundLedgerId = ledgerEntry._id;
    }

    await request.save({ session });

    // Notify the student
    const notifType = status === 'accepted'
      ? NOTIFICATION_TYPES.REFERRAL_REQUEST_ACCEPTED
      : NOTIFICATION_TYPES.REFERRAL_REQUEST_DECLINED;

    const notifMessage = status === 'accepted'
      ? `Great news! Your referral request for ${request.job.title} at ${request.job.company} was accepted.`
      : `Your referral request for ${request.job.title} at ${request.job.company} was declined. Your point has been refunded.`;

    await Notification.create(
      [{
        recipient: request.requestedBy,
        type:      notifType,
        title:     status === 'accepted' ? 'Referral Accepted! 🎉' : 'Referral Declined',
        message:   notifMessage,
        actionUrl: `/referrals/${request._id}`,
        refModel:  'ReferralRequest',
        refId:     request._id,
      }],
      { session }
    );

    await session.commitTransaction();

    return res.json({
      success: true,
      message: `Request ${status}.`,
      data: { request },
    });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * GET /api/v1/referrals/sent     – student's outgoing requests
 * GET /api/v1/referrals/received – alumni's incoming requests
 */
async function getSentRequests(req, res) {
  const requests = await ReferralRequest.find({ requestedBy: req.user._id })
    .populate('job', 'title company location jobType')
    .populate('requestedFrom', 'fullName company jobTitle avatar')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { requests } });
}

async function getReceivedRequests(req, res) {
  const { status } = req.query;
  const filter = { requestedFrom: req.user._id };
  if (status) filter.status = status;

  const requests = await ReferralRequest.find(filter)
    .populate('job', 'title company location jobType')
    .populate('requestedBy', 'fullName department graduationYear avatar socialLinks cgpa techStack')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { requests } });
}

module.exports = {
  createReferralRequest,
  respondToReferral,
  getSentRequests,
  getReceivedRequests,
};
