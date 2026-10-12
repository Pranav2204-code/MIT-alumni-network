const express = require('express');
const router = express.Router();

const { verifyPrn, register, login, logout, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { authRateLimiter, verificationRateLimiter } = require('../middleware/rateLimit.middleware');
const { validate, verifyPrnSchema, registerSchema, loginSchema } = require('../middleware/validate.middleware');

// Two-step registration flow
router.post('/verify-prn', verificationRateLimiter, validate(verifyPrnSchema), verifyPrn);
router.post('/register',   authRateLimiter,         validate(registerSchema),  register);

// Session management
router.post('/login',  authRateLimiter, validate(loginSchema), login);
router.post('/logout', logout);

// Current user
router.get('/me', protect, getMe);

module.exports = router;
