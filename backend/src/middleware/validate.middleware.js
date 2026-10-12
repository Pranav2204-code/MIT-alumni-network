const { z } = require('zod');

/**
 * validate(schema) – Zod-based request validation middleware factory.
 * Validates req.body against the schema. Returns 422 on failure.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(422).json({ message: 'Validation failed', errors });
    }
    req.body = result.data; // use parsed/coerced data
    next();
  };
}

// ── Shared Zod schemas ────────────────────────────────────

const verifyPrnSchema = z.object({
  prn:         z.string().min(1).max(20).trim().toUpperCase(),
  fullName:    z.string().min(2).max(100).trim(),
  dob:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be YYYY-MM-DD'),
});

const registerSchema = z.object({
  prn:             z.string().min(1).max(20).trim().toUpperCase(),
  email:           z.string().email().toLowerCase().trim(),
  password:        z.string().min(8, 'Password must be at least 8 characters')
                     .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
                     .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email:    z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  bio:        z.string().max(500).optional(),
  location:   z.string().max(100).optional(),
  jobTitle:   z.string().max(100).optional(),
  company:    z.string().max(100).optional(),
  techStack:  z.array(z.string().max(50)).max(20).optional(),
  cgpa:       z.number().min(0).max(10).optional(),
  socialLinks: z.object({
    linkedin:   z.string().url().or(z.literal('')).optional(),
    github:     z.string().url().or(z.literal('')).optional(),
    leetcode:   z.string().url().or(z.literal('')).optional(),
    codeforces: z.string().url().or(z.literal('')).optional(),
    hackerrank: z.string().url().or(z.literal('')).optional(),
    portfolio:  z.string().url().or(z.literal('')).optional(),
  }).optional(),
});

const createJobSchema = z.object({
  title:          z.string().min(3).max(120).trim(),
  company:        z.string().min(1).max(100).trim(),
  location:       z.string().min(1).max(100).trim(),
  isRemote:       z.boolean().optional(),
  jobType:        z.enum(['full-time','part-time','internship','contract','freelance']),
  domain:         z.string().min(1),
  description:    z.string().min(20).max(3000),
  requirements:   z.string().max(2000).optional(),
  salaryMin:      z.number().positive().optional(),
  salaryMax:      z.number().positive().optional(),
  skillsRequired: z.array(z.string()).max(15).optional(),
  referralSlots:  z.number().int().min(1).max(20).optional(),
  deadline:       z.string().datetime().optional(),
  externalLink:   z.string().url().or(z.literal('')).optional(),
});

const referralRequestSchema = z.object({
  jobId:   z.string().length(24, 'Invalid job ID'),
  message: z.string().max(500).optional(),
});

const quizSubmitSchema = z.object({
  quizId:  z.string().length(24, 'Invalid quiz ID'),
  // Array of answer indices (0-3), one per question
  answers: z.array(z.number().int().min(0).max(3)).min(1),
  timeTakenSeconds: z.number().int().positive().optional(),
});

module.exports = {
  validate,
  schemas: {
    verifyPrn:       verifyPrnSchema,
    register:        registerSchema,
    login:           loginSchema,
    updateProfile:   updateProfileSchema,
    createJob:       createJobSchema,
    referralRequest: referralRequestSchema,
    quizSubmit:      quizSubmitSchema,
  },
};
