const Job = require('../models/Job');

/**
 * POST /api/v1/jobs – alumni creates a job post
 */
async function createJob(req, res) {
  if (req.user.role === 'student') {
    return res.status(403).json({ message: 'Only alumni can post jobs.' });
  }

  const job = await Job.create({ ...req.body, postedBy: req.user._id });
  await job.populate('postedBy', 'fullName company jobTitle avatar');

  res.status(201).json({ success: true, data: { job } });
}

/**
 * GET /api/v1/jobs – public job board with filters
 */
async function listJobs(req, res) {
  const {
    domain, jobType, company, isRemote,
    search, page = 1, limit = 20,
  } = req.query;

  const filter = { isActive: true, isDeleted: false };
  if (domain)   filter.domain = domain;
  if (jobType)  filter.jobType = jobType;
  if (company)  filter.company = new RegExp(company, 'i');
  if (isRemote !== undefined) filter.isRemote = isRemote === 'true';

  if (search) {
    filter.$or = [
      { title:          new RegExp(search, 'i') },
      { company:        new RegExp(search, 'i') },
      { description:    new RegExp(search, 'i') },
      { skillsRequired: new RegExp(search, 'i') },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('postedBy', 'fullName company jobTitle avatar graduationYear')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Job.countDocuments(filter),
  ]);

  // Attach hasSlotsAvailable as a plain field for the client
  const jobsWithSlots = jobs.map((j) => ({
    ...j,
    hasSlotsAvailable: j.referralsFilled < j.referralSlots,
  }));

  res.json({
    success: true,
    data: { jobs: jobsWithSlots, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  });
}

/**
 * GET /api/v1/jobs/:id
 */
async function getJob(req, res) {
  const job = await Job.findById(req.params.id)
    .populate('postedBy', 'fullName company jobTitle avatar graduationYear department socialLinks');

  if (!job || job.isDeleted) {
    return res.status(404).json({ message: 'Job not found.' });
  }

  res.json({ success: true, data: { job } });
}

/**
 * PATCH /api/v1/jobs/:id – alumni edits their own job
 */
async function updateJob(req, res) {
  const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });
  if (!job) {
    return res.status(404).json({ message: 'Job not found or you do not own this listing.' });
  }

  const allowed = [
    'title','company','location','isRemote','jobType','domain',
    'description','requirements','salaryMin','salaryMax',
    'skillsRequired','referralSlots','deadline','externalLink','isActive',
  ];
  for (const field of allowed) {
    if (req.body[field] !== undefined) job[field] = req.body[field];
  }

  await job.save();
  res.json({ success: true, data: { job } });
}

/**
 * DELETE /api/v1/jobs/:id – soft delete
 */
async function deleteJob(req, res) {
  const job = await Job.findOne({
    _id: req.params.id,
    $or: [{ postedBy: req.user._id }, { _: req.user.role === 'admin' }],
  });

  if (!job) {
    return res.status(404).json({ message: 'Job not found.' });
  }

  job.isDeleted = true;
  job.isActive = false;
  await job.save();

  res.json({ success: true, message: 'Job listing removed.' });
}

/**
 * GET /api/v1/jobs/my-posts – alumni's own job postings
 */
async function getMyJobs(req, res) {
  const jobs = await Job.find({ postedBy: req.user._id, isDeleted: false })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { jobs } });
}

module.exports = { createJob, listJobs, getJob, updateJob, deleteJob, getMyJobs };
