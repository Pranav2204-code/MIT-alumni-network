const express = require('express');
const router = express.Router();

const {
  listUsers,
  verifyUser,
  toggleUserActive,
  adminAwardPoints,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  listVerificationRecords,
  getPlatformStats,
} = require('../controllers/admin.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

// All admin routes: must be authenticated AND have admin role
router.use(protect, restrictTo('admin'));

// Dashboard
router.get('/stats', getPlatformStats);

// User management
router.get('/users',                    listUsers);
router.patch('/users/:id/verify',       verifyUser);
router.patch('/users/:id/toggle-active', toggleUserActive);
router.post('/users/:id/award-points',  adminAwardPoints);

// Quiz management
router.post('/quizzes',        createQuiz);
router.patch('/quizzes/:id',   updateQuiz);
router.delete('/quizzes/:id',  deleteQuiz);

// Verification records
router.get('/verification-records', listVerificationRecords);

module.exports = router;
