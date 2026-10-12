const express = require('express');
const router = express.Router();

const { listQuizzes, getQuizForAttempt, submitQuiz, getMyAttempts } = require('../controllers/quiz.controller');
const { protect }   = require('../middleware/auth.middleware');
const { quizRateLimiter } = require('../middleware/rateLimit.middleware');
const { validate, quizSubmitSchema } = require('../middleware/validate.middleware');

// All quiz routes require login
router.use(protect);

router.get('/',                    listQuizzes);
router.get('/my-attempts',         getMyAttempts);
router.get('/:id/attempt',         getQuizForAttempt);
router.post('/:id/submit', quizRateLimiter, validate(quizSubmitSchema), submitQuiz);

module.exports = router;
