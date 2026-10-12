const User = require('../models/User');
const { validateSocialLinks } = require('../utils/url.utils');
const { getPointsHistory } = require('../utils/points.utils');

/**
 * GET /api/v1/users – searchable alumni/student directory
 */
async function getDirectory(req, res) {
  const {
    role, department, company, graduationYear,
    search, page = 1, limit = 20,
  } = req.query;

  const filter = { isActive: true };
  if (role)           filter.role = role;
  if (department)     filter.department = department;
  if (company)        filter.company = new RegExp(company, 'i');
  if (graduationYear) filter.graduationYear = Number(graduationYear);

  if (search) {
    filter.$or = [
      { fullName:  new RegExp(search, 'i') },
      { jobTitle:  new RegExp(search, 'i') },
      { company:   new RegExp(search, 'i') },
      { techStack: new RegExp(search, 'i') },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('fullName role department graduationYear jobTitle company location avatar bio techStack socialLinks isProfileComplete isVerified')
      .sort({ graduationYear: -1, fullName: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
}

/**
 * GET /api/v1/users/:id – public profile
 */
async function getUserProfile(req, res) {
  const user = await User.findById(req.params.id)
    .select('-email -password -passwordResetToken -passwordResetExpires -verificationRecord');

  if (!user || !user.isActive) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.json({ success: true, data: { user } });
}

/**
 * PATCH /api/v1/users/me – update own profile
 */
async function updateMyProfile(req, res) {
  const allowedFields = [
    'bio', 'location', 'jobTitle', 'company',
    'techStack', 'cgpa', 'socialLinks',
  ];

  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  // Validate social links using URL parser (not string.includes)
  if (updates.socialLinks) {
    const errors = validateSocialLinks(updates.socialLinks);
    if (errors.length) {
      return res.status(400).json({ message: 'Invalid social link(s)', errors });
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  user.checkProfileComplete();
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, data: { user } });
}

/**
 * GET /api/v1/users/me/points – wallet balance and history
 */
async function getMyPoints(req, res) {
  const { page = 1, limit = 20 } = req.query;
  const user = await User.findById(req.user._id).select('referralPoints fullName');
  const history = await getPointsHistory(req.user._id, Number(page), Number(limit));

  res.json({
    success: true,
    data: { balance: user.referralPoints, history },
  });
}

/**
 * GET /api/v1/users/me/notifications
 */
async function getMyNotifications(req, res) {
  const Notification = require('../models/Notification');
  const { unreadOnly } = req.query;

  const filter = { recipient: req.user._id };
  if (unreadOnly === 'true') filter.isRead = false;

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  res.json({ success: true, data: { notifications, unreadCount } });
}

/**
 * PATCH /api/v1/users/me/notifications/read-all
 */
async function markAllNotificationsRead(req, res) {
  const Notification = require('../models/Notification');
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );
  res.json({ success: true, message: 'All notifications marked as read.' });
}

module.exports = {
  getDirectory,
  getUserProfile,
  updateMyProfile,
  getMyPoints,
  getMyNotifications,
  markAllNotificationsRead,
};
