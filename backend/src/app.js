const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { globalRateLimiter } = require('./middleware/rateLimit.middleware');

// ── Route imports ──────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const jobRoutes = require('./routes/job.routes');
const referralRoutes = require('./routes/referral.routes');
const quizRoutes = require('./routes/quiz.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// ── Security headers ───────────────────────────────────────
app.use(helmet());

// ── CORS – locked to frontend origin ──────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,          // needed for httpOnly cookie JWTs
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Parsers ────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));   // prevent payload bombs
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ── Logging (skip in test env) ─────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Global rate limit ─────────────────────────────────────
app.use('/api', globalRateLimiter);

// ── Health check ───────────────────────────────────────────
app.get('/api/v1/health', (_req, res) =>
  res.json({ status: 'ok', env: process.env.NODE_ENV })
);

// ── Routes ─────────────────────────────────────────────────
app.use('/api/v1/auth',     authRoutes);
app.use('/api/v1/users',    userRoutes);
app.use('/api/v1/jobs',     jobRoutes);
app.use('/api/v1/referrals',referralRoutes);
app.use('/api/v1/quizzes',  quizRoutes);
app.use('/api/v1/admin',    adminRoutes);

// ── 404 fallback ───────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Global error handler ───────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  if (process.env.NODE_ENV === 'development') console.error(err.stack);
  res.status(status).json({ message, ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) });
});

module.exports = app;
