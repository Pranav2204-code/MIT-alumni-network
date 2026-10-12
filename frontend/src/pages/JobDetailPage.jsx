import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';

export default function JobDetailPage() {
  const { id }     = useParams();
  const user       = useAuthStore((s) => s.user);
  const setUser    = useAuthStore((s) => s.setUser);
  const navigate   = useNavigate();

  const [job, setJob]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get(`/jobs/${id}`).then(({ data }) => setJob(data.data.job)).finally(() => setLoading(false));
  }, [id]);

  async function handleRequest() {
    if (!msg.trim()) return toast.error('Add a short message for the alumni.');
    setSending(true);
    try {
      const { data } = await api.post('/referrals', { jobId: id, message: msg });
      toast.success('Referral request sent! 1 point spent.');
      // Update local points balance
      setUser({ ...user, referralPoints: data.data.newBalance });
      navigate('/referrals');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent" />
    </div>
  );
  if (!job) return <p className="text-center py-20 text-gray-400">Job not found.</p>;

  const isStudent = user?.role === 'student';
  const isOwner   = job.postedBy?._id === user?._id;
  const hasSlots  = job.referralsFilled < job.referralSlots;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/jobs" className="text-sm text-brand-600 hover:underline mb-4 inline-block">← Back to Jobs</Link>

      {/* Header */}
      <div className="card mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-gray-600 mt-1">{job.company} · {job.location}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="badge-blue capitalize">{job.jobType?.replace('_', ' ')}</span>
              <span className="badge-gray">{job.domain}</span>
              {job.isRemote && <span className="badge-green">Remote</span>}
            </div>
          </div>
          <div className="text-right">
            {hasSlots
              ? <span className="badge-green text-sm px-3 py-1">Open for referrals</span>
              : <span className="badge-red text-sm px-3 py-1">Referral slots full</span>}
            <p className="text-xs text-gray-400 mt-2">
              {job.referralsFilled}/{job.referralSlots} slots used
            </p>
          </div>
        </div>

        {(job.salaryMin || job.salaryMax) && (
          <p className="mt-3 text-sm text-gray-600">
            💰 {job.salaryMin ? `₹${(job.salaryMin/100000).toFixed(1)}L` : ''} — {job.salaryMax ? `₹${(job.salaryMax/100000).toFixed(1)}L` : ''}
          </p>
        )}
        {job.deadline && (
          <p className="text-sm text-red-500 mt-1">
            ⏰ Apply by {format(new Date(job.deadline), 'dd MMM yyyy')}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="card mb-5">
        <h2 className="font-semibold text-gray-800 mb-3">About the role</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>

        {job.requirements && (
          <>
            <h2 className="font-semibold text-gray-800 mt-5 mb-2">Requirements</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
          </>
        )}

        {job.skillsRequired?.length > 0 && (
          <>
            <h2 className="font-semibold text-gray-800 mt-5 mb-2">Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {job.skillsRequired.map((s) => <span key={s} className="badge badge-gray">{s}</span>)}
            </div>
          </>
        )}

        {job.externalLink && (
          <a href={job.externalLink} target="_blank" rel="noopener noreferrer"
            className="btn-secondary mt-4 inline-flex text-sm">
            View full listing ↗
          </a>
        )}
      </div>

      {/* Posted by */}
      <div className="card mb-5">
        <h2 className="font-semibold text-gray-800 mb-3">Posted by</h2>
        <Link to={`/users/${job.postedBy?._id}`} className="flex items-center gap-3 hover:opacity-80">
          <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
            {job.postedBy?.fullName?.[0]}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{job.postedBy?.fullName}</p>
            <p className="text-xs text-gray-500">{job.postedBy?.jobTitle} · Class of {job.postedBy?.graduationYear}</p>
          </div>
        </Link>
      </div>

      {/* Referral request (students only) */}
      {isStudent && !isOwner && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-1">Request Referral</h2>
          <p className="text-sm text-gray-500 mb-4">
            Costs <span className="font-semibold text-brand-700">1 referral point</span> (you have {user?.referralPoints}).
            Declined requests are automatically refunded.
          </p>
          {!hasSlots ? (
            <p className="text-sm text-red-500">All referral slots for this job have been filled.</p>
          ) : user?.referralPoints < 1 ? (
            <p className="text-sm text-gray-500">
              You don't have enough points.{' '}
              <Link to="/quizzes" className="text-brand-600 font-medium hover:underline">Earn more →</Link>
            </p>
          ) : (
            <>
              <textarea
                className="input mb-3 resize-none h-28"
                placeholder="Introduce yourself. Mention your background, why you're excited about this role, and anything that makes you a strong candidate…"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{msg.length}/500</span>
                <button onClick={handleRequest} disabled={sending} className="btn-primary">
                  {sending ? 'Sending…' : '🤝 Request Referral (1 pt)'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
