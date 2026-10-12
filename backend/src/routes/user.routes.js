const express = require('express');
const router = express.Router();

const {
  getDirectory,
  getUserProfile,
  updateMyProfile,
  getMyPoints,
  getMyNotifications,
  markAllNotificationsRead,
} = require('../controllers/user.controller');
const { protect }   = require('../middleware/auth.middleware');
const { validate, updateProfileSchema } = require('../middleware/validate.middleware');

// All routes require authentication
router.use(protect);

// Self-management
router.patch('/me',                           validate(updateProfileSchema), updateMyProfile);
router.get('/me/points',                      getMyPoints);
router.get('/me/notifications',               getMyNotifications);
router.patch('/me/notifications/read-all',    markAllNotificationsRead);

// Directory – authenticated only so profiles stay within the network
router.get('/',     getDirectory);
router.get('/:id',  getUserProfile);

module.exports = router;
