import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../lib/axios';

function StatCard({ icon, label, value, to }) {
  const content = (
    <div className="card flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => {
    // Fetch points balance
    api.get('/users/me/points').then(({ data }) => {
      setStats((s) => ({ ...s, balance: data.data.balance }));
    }).catch(() => {});

    // Fetch recent jobs
    api.get('/jobs?limit=5').then(({ data }) => {
      setRecentJobs(data.data.jobs);
    }).catch(() => {});

    // Fetch referrals count
    const endpoint = user?.role === 'student' ? '/referrals/sent' : '/referrals/received';
    api.get(endpoint).then(({ data }) => {
      setStats((s) => ({ ...s, referrals: data.data.requests.length }));
    }).catch(() => {});
  }, [user?.role]);

  const isAlumni  = user?.role === 'alumni';
  const isStudent = user?.role === 'student';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Hey {user?.fullName?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {user?.role === 'alumni'
            ? 'Help students grow by sharing your experience and referrals.'
            : 'Earn referral points by taking quizzes and connecting with alumni.'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon="🪙" label="Referral Points" value={stats?.balance ?? user?.referralPoints ?? 0} to="/wallet" />
        <StatCard
          icon={isAlumni ? '📥' : '📤'}
          label={isAlumni ? 'Requests Received' : 'Referrals Sent'}
          value={stats?.referrals ?? '—'}
          to="/referrals"
        />
        <StatCard icon="💼" label="Active Jobs" value={recentJobs.length || '—'} to="/jobs" />
      </div>

      {/* Profile incomplete warning */}
      {!user?.isProfileComplete && (
        <div className="mb-6 rounded-xl bg-yellow-50 border border-yellow-200 p-4 flex items-start gap-3">
          <span className="text-xl mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-medium text-yellow-800">Your profile is incomplete</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Add your bio, current role, and social links to appear in the alumni directory.
            </p>
            <Link to="/settings" className="text-xs font-medium text-yellow-900 underline mt-1 inline-block">
              Complete profile →
            </Link>
          </div>
        </div>
      )}

      {/* Alumni verification pending */}
      {isAlumni && !user?.isVerified && (
        <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
          <span className="text-xl mt-0.5">🕐</span>
          <div>
            <p className="text-sm font-medium text-blue-800">Verification pending</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Your alumni status is being reviewed by an admin. You'll be notified once approved.
            </p>
          </div>
        </div>
      )}

      {/* Recent Jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Job Postings</h2>
          <Link to="/jobs" className="text-sm text-brand-600 hover:underline font-medium">View all →</Link>
        </div>

        {recentJobs.length === 0 ? (
          <p className="text-sm text-gray-400">No jobs posted yet.</p>
        ) : (
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <Link
                key={job._id}
                to={`/jobs/${job._id}`}
                className="card flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{job.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{job.company} · {job.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  {job.hasSlotsAvailable
                    ? <span className="badge-green">Slots open</span>
                    : <span className="badge-gray">Full</span>}
                  <span className="text-gray-300 text-lg">›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA for students */}
      {isStudent && (
        <div className="mt-8 rounded-xl bg-brand-50 border border-brand-200 p-5">
          <h3 className="font-semibold text-brand-900">Earn more referral points 🎯</h3>
          <p className="text-sm text-brand-700 mt-1">
            Take quizzes and pass them to earn points. Each point can be spent on a referral request from an alumni.
          </p>
          <Link to="/quizzes" className="btn-primary mt-3 inline-flex text-sm">
            Browse Quizzes →
          </Link>
        </div>
      )}
    </div>
  );
}
