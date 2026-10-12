const express = require('express');
const router = express.Router();

const { createJob, listJobs, getJob, updateJob, deleteJob, getMyJobs } = require('../controllers/job.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { validate, createJobSchema } = require('../middleware/validate.middleware');

// Public job board
router.get('/', listJobs);
router.get('/:id', getJob);

// Protected routes (require login)
router.use(protect);

// Alumni + admin only
router.post('/',           restrictTo('alumni', 'admin'), validate(createJobSchema), createJob);
router.get('/my-posts',    restrictTo('alumni', 'admin'), getMyJobs);
router.patch('/:id',       restrictTo('alumni', 'admin'), updateJob);
router.delete('/:id',      restrictTo('alumni', 'admin'), deleteJob);

module.exports = router;
