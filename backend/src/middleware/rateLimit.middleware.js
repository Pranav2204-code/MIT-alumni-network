const rateLimit = require('express-rate-limit');

/**
 * Global API rate limiter – 100 requests per 15 minutes per IP.
 */
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});

/**
 * Strict auth rate limiter – 10 attempts per 15 minutes.
 * Applied on login and registration routes.
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Try again in 15 minutes.' },
});

/**
 * Verification rate limiter – 5 PRN checks per hour.
 * Prevents brute-forcing PRNs during registration.
 */
const verificationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many verification attempts. Try again in 1 hour.' },
});

/**
 * Quiz submission rate limiter – 20 per hour.
 */
const quizRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many quiz submissions. Please slow down.' },
});

module.exports = {
  globalRateLimiter,
  authRateLimiter,
  verificationRateLimiter,
  quizRateLimiter,
};
