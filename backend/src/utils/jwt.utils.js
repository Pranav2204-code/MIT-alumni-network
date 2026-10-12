const jwt = require('jsonwebtoken');

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';
const COOKIE_DAYS = Number(process.env.JWT_COOKIE_EXPIRES_DAYS) || 7;

if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable not set');

/**
 * Signs a JWT payload and returns the token string.
 */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

/**
 * Verifies and decodes a JWT. Throws on invalid/expired tokens.
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Sends a JWT as an httpOnly cookie and also in the response body.
 * Using httpOnly cookie prevents XSS-based token theft.
 */
function sendTokenResponse(res, user, statusCode = 200) {
  const token = signToken({ id: user._id, role: user.role });

  const cookieOptions = {
    expires: new Date(Date.now() + COOKIE_DAYS * 24 * 60 * 60 * 1000),
    httpOnly: true,                            // not accessible via JS
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
  };

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  const userData = user.toJSON ? user.toJSON() : { ...user._doc };
  delete userData.password;

  res.status(statusCode).json({
    success: true,
    token,  // also send in body for clients that prefer header auth
    data: { user: userData },
  });
}

module.exports = { signToken, verifyToken, sendTokenResponse };
