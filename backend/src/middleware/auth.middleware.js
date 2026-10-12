const { verifyToken } = require('../utils/jwt.utils');
const User = require('../models/User');

/**
 * protect – verifies JWT from cookie or Authorization header.
 * Attaches req.user on success.
 */
async function protect(req, res, next) {
  try {
    let token;

    // 1. Try httpOnly cookie first (preferred)
    if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }
    // 2. Fall back to Authorization header (for API clients / mobile)
    else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated. Please log in.' });
    }

    // Verify and decode
    const decoded = verifyToken(token);

    // Fetch fresh user (catches deleted/deactivated accounts)
    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'User account no longer exists.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token. Please log in again.' });
  }
}

/**
 * restrictTo – role-based access control factory.
 * Usage: restrictTo('admin'), restrictTo('alumni', 'admin')
 */
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
}

/**
 * optionalAuth – attaches req.user if a valid token is present,
 * but does not block the request if there is none.
 */
async function optionalAuth(req, _res, next) {
  try {
    let token = req.cookies?.jwt || req.headers.authorization?.split(' ')[1];
    if (!token) return next();
    const decoded = verifyToken(token);
    req.user = await User.findById(decoded.id);
  } catch {
    // silently ignore invalid tokens for optional auth
  }
  next();
}

module.exports = { protect, restrictTo, optionalAuth };
