import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';

export default function QuizAttemptPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const setUser     = useAuthStore((s) => s.setUser);
  const user        = useAuthStore((s) => s.user);

  const [quiz, setQuiz]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState([]);
  const [current, setCurrent] = useState(0);
  const [result, setResult]   = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Timer
  const startRef  = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const timerRef  = useRef(null);

  useEffect(() => {
    api.get(`/quizzes/${id}/attempt`).then(({ data }) => {
      setQuiz(data.data.quiz);
      setAnswers(new Array(data.data.quiz.questions.length).fill(null));
    }).catch((err) => {
      toast.error(err.message);
      navigate('/quizzes');
    }).finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (!quiz) return;
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(timerRef.current);
  }, [quiz]);

  function selectAnswer(optionIdx) {
    setAnswers((a) => {
      const next = [...a];
      next[current] = optionIdx;
      return next;
    });
  }

  async function handleSubmit() {
    if (answers.some((a) => a === null)) {
      return toast.error('Answer all questions before submitting.');
    }
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const { data } = await api.post(`/quizzes/${id}/submit`, {
        answers,
        timeTakenSeconds: Math.floor((Date.now() - startRef.current) / 1000),
      });
      setResult(data.data);
      if (data.data.attempt.pointsAwarded > 0) {
        setUser({ ...user, referralPoints: (user?.referralPoints || 0) + data.data.attempt.pointsAwarded });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent" />
    </div>
  );
  if (!quiz) return null;

  const q = quiz.questions[current];
  const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs = (elapsed % 60).toString().padStart(2, '0');

  // ── Results screen ───────────────────────────────────────────────────────────
  if (result) {
    const { attempt, questions: graded } = result;
    return (
      <div className="max-w-2xl mx-auto">
        <div className={`card mb-6 text-center border-2 ${attempt.passed ? 'border-green-300 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="text-5xl mb-3">{attempt.passed ? '🏆' : '😔'}</div>
          <h2 className="text-2xl font-bold text-gray-900">
            {attempt.passed ? 'You passed!' : 'Better luck next time'}
          </h2>
          <p className="text-gray-600 mt-1">
            {attempt.correctAnswers}/{attempt.totalQuestions} correct · {attempt.score}%
          </p>
          {attempt.pointsAwarded > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 bg-gold-400/20 px-4 py-2 rounded-full">
              <span className="text-xl">🪙</span>
              <span className="font-bold text-gold-600">+{attempt.pointsAwarded} referral point earned!</span>
            </div>
          )}
        </div>

        <h3 className="font-semibold text-gray-800 mb-4">Review Answers</h3>
        <div className="space-y-4">
          {graded.map((gq, i) => (
            <div key={i} className={`card border-l-4 ${gq.isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <p className="font-medium text-gray-900 mb-3">Q{i + 1}. {gq.text}</p>
              {gq.options.map((opt, oi) => (
                <div key={oi} className={`text-sm px-3 py-2 rounded-lg mb-1.5 ${
                  oi === gq.correctIndex ? 'bg-green-100 text-green-800 font-medium' :
                  oi === gq.selectedIndex && !gq.isCorrect ? 'bg-red-100 text-red-700' :
                  'text-gray-600'
                }`}>
                  {oi === gq.correctIndex && '✓ '}{opt}
                  {oi === gq.selectedIndex && oi !== gq.correctIndex && ' ✗ (your answer)'}
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-2 border-t pt-2">💡 {gq.explanation}</p>
            </div>
          ))}
        </div>

        <button onClick={() => navigate('/quizzes')} className="btn-primary mt-6 w-full">
          Back to Quizzes
        </button>
      </div>
    );
  }

  // ── Question screen ──────────────────────────────────────────────────────────
  const answered = answers.filter((a) => a !== null).length;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
        <span>Question {current + 1} of {quiz.questions.length}</span>
        <div className="flex items-center gap-4">
          <span>{answered}/{quiz.questions.length} answered</span>
          <span className="font-mono text-gray-700">{mins}:{secs}</span>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full mb-6">
        <div
          className="h-full bg-brand-500 rounded-full transition-all"
          style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="card mb-4">
        <p className="font-semibold text-gray-900 text-base leading-relaxed">{q.text}</p>
        <span className={`badge mt-2 ${q.difficulty === 'easy' ? 'badge-green' : q.difficulty === 'hard' ? 'badge-red' : 'badge-yellow'}`}>
          {q.difficulty}
        </span>
      </div>

      {/* Options */}
      <div className="space-y-2 mb-6">
        {q.options.map((opt, oi) => (
          <button
            key={oi}
            onClick={() => selectAnswer(oi)}
            className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
              answers[current] === oi
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span>
            {opt}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setCurrent((c) => c - 1)} disabled={current === 0} className="btn-secondary">
          ← Prev
        </button>

        <div className="flex gap-1">
          {quiz.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${
                i === current ? 'bg-brand-600 text-white' :
                answers[i] !== null ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {current < quiz.questions.length - 1 ? (
          <button onClick={() => setCurrent((c) => c + 1)} className="btn-primary">
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || answers.some((a) => a === null)}
            className="btn-primary"
          >
            {submitting ? 'Grading…' : 'Submit Quiz ✓'}
          </button>
        )}
      </div>
    </div>
  );
}
