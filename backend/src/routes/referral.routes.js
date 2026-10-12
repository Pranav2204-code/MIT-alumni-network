const express = require('express');
const router = express.Router();

const {
  createReferralRequest,
  respondToReferral,
  getSentRequests,
  getReceivedRequests,
} = require('../controllers/referral.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { validate, referralRequestSchema } = require('../middleware/validate.middleware');

// All referral routes require authentication
router.use(protect);

// Students: send requests and view their own
router.post('/',        restrictTo('student'),        validate(referralRequestSchema), createReferralRequest);
router.get('/sent',     restrictTo('student'),        getSentRequests);

// Alumni: view incoming and respond
router.get('/received', restrictTo('alumni', 'admin'), getReceivedRequests);
router.patch('/:id/respond', restrictTo('alumni', 'admin'), respondToReferral);

module.exports = router;
