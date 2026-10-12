import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../lib/axios';

function CooldownBadge({ until }) {
  return (
    <span className="badge badge-yellow text-xs">
      🕐 Cooldown until {format(new Date(until), 'dd MMM, HH:mm')}
    </span>
  );
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/quizzes'),
      api.get('/quizzes/my-attempts'),
    ]).then(([q, a]) => {
      setQuizzes(q.data.data.quizzes);
      setAttempts(a.data.data.attempts);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Quizzes</h1>
      <p className="text-gray-500 text-sm mb-6">
        Pass a quiz to earn a referral point. Each quiz has a 7-day cooldown before you can earn again.
      </p>

      <div className="space-y-4">
        {quizzes.map((quiz) => {
          const last = quiz.lastAttempt;
          const canAttempt = !last || !last.cooldownActive;

          return (
            <div key={quiz._id} className="card flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                  <span className="badge badge-blue capitalize">{quiz.category}</span>
                </div>
                <p className="text-xs text-gray-400">
                  {quiz.questionCount} questions · {quiz.timeLimitMinutes} min ·&nbsp;
                  Pass at {quiz.passScore}% · <span className="text-gold-600 font-medium">+{quiz.pointsAwarded} pt on pass</span>
                </p>

                {last && (
                  <div className="mt-2 flex flex-wrap gap-2 items-center">
                    <span className={`badge ${last.passed ? 'badge-green' : 'badge-red'}`}>
                      Last: {last.score}% {last.passed ? '✓' : '✗'}
                    </span>
                    {last.cooldownActive && <CooldownBadge until={last.cooldownUntil} />}
                    {!last.cooldownActive && (
                      <span className="text-xs text-gray-400">
                        Attempted {formatDistanceToNow(new Date(last.attemptedAt))} ago
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0">
                {canAttempt ? (
                  <Link to={`/quizzes/${quiz._id}`} className="btn-primary text-sm">
                    {last ? 'Retry' : 'Start →'}
                  </Link>
                ) : (
                  <button disabled className="btn-secondary text-sm cursor-not-allowed opacity-60">Cooldown</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Attempt history */}
      {attempts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Attempt History</h2>
          <div className="space-y-2">
            {attempts.slice(0, 10).map((a) => (
              <div key={a._id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                <div>
                  <span className="font-medium">{a.quiz?.title}</span>
                  <span className="text-gray-400 ml-2">{formatDistanceToNow(new Date(a.createdAt))} ago</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${a.passed ? 'badge-green' : 'badge-red'}`}>{a.score}%</span>
                  {a.pointsAwarded > 0 && <span className="badge-yellow badge">+{a.pointsAwarded} pt</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
