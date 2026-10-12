import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';

const STATUS_STYLE = {
  pending:  'badge-yellow',
  accepted: 'badge-green',
  declined: 'badge-red',
  expired:  'badge-gray',
};

// ── Alumni: incoming request card ─────────────────────────────────────────────
function ReceivedCard({ req, onRespond }) {
  const [note, setNote]   = useState('');
  const [open, setOpen]   = useState(false);
  const [busy, setBusy]   = useState(false);

  async function respond(status) {
    setBusy(true);
    try {
      await api.patch(`/referrals/${req._id}/respond`, { status, responseNote: note });
      toast.success(`Request ${status}.`);
      onRespond();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {req.requestedBy?.fullName?.[0]}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to={`/users/${req.requestedBy?._id}`} className="font-semibold text-gray-900 text-sm hover:underline">
                {req.requestedBy?.fullName}
              </Link>
              <span className={`badge ${STATUS_STYLE[req.status]}`}>{req.status}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {req.requestedBy?.department} · CGPA {req.requestedBy?.cgpa || 'N/A'}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              For: <span className="font-medium">{req.job?.title}</span> at {req.job?.company}
            </p>
            {req.message && (
              <p className="text-xs text-gray-500 mt-1.5 italic">"{req.message}"</p>
            )}
            <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(req.createdAt))} ago</p>
          </div>
        </div>

        {req.requestedBy?.socialLinks && (
          <div className="flex gap-2 flex-shrink-0">
            {req.requestedBy.socialLinks.linkedin && (
              <a href={req.requestedBy.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                className="badge badge-blue text-xs">LinkedIn</a>
            )}
            {req.requestedBy.socialLinks.github && (
              <a href={req.requestedBy.socialLinks.github} target="_blank" rel="noopener noreferrer"
                className="badge badge-gray text-xs">GitHub</a>
            )}
          </div>
        )}
      </div>

      {req.status === 'pending' && (
        <div className="mt-4">
          {open ? (
            <div className="space-y-2">
              <textarea
                className="input resize-none h-20 text-sm"
                placeholder="Optional note to the student…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={() => respond('accepted')} disabled={busy} className="btn-primary flex-1 text-sm">
                  ✓ Accept
                </button>
                <button onClick={() => respond('declined')} disabled={busy} className="btn-danger flex-1 text-sm">
                  ✗ Decline (refunds their point)
                </button>
                <button onClick={() => setOpen(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setOpen(true)} className="btn-secondary text-sm">
              Respond to request
            </button>
          )}
        </div>
      )}

      {req.responseNote && (
        <p className="text-xs text-gray-500 mt-3 italic border-t pt-2">Note: "{req.responseNote}"</p>
      )}
    </div>
  );
}

// ── Student: sent request card ────────────────────────────────────────────────
function SentCard({ req }) {
  return (
    <div className="card flex items-start justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-sm text-gray-900">{req.job?.title}</p>
          <span className={`badge ${STATUS_STYLE[req.status]}`}>{req.status}</span>
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{req.job?.company} · {req.job?.location}</p>
        <p className="text-xs text-gray-400 mt-1">
          Requested {formatDistanceToNow(new Date(req.createdAt))} ago
          {req.responseNote && ` · Note: "${req.responseNote}"`}
        </p>
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0">
        {req.pointsRefunded ? '🔄 Point refunded' : `🪙 1 pt spent`}
      </span>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ReferralsPage() {
  const user  = useAuthStore((s) => s.user);
  const isAlumni = user?.role === 'alumni' || user?.role === 'admin';

  const [requests, setRequests] = useState([]);
  const [filter, setFilter]     = useState('all');
  const [loading, setLoading]   = useState(true);

  function load() {
    setLoading(true);
    const endpoint = isAlumni ? '/referrals/received' : '/referrals/sent';
    const params   = filter !== 'all' ? `?status=${filter}` : '';
    api.get(`${endpoint}${params}`).then(({ data }) => {
      setRequests(data.data.requests);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [filter, isAlumni]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {isAlumni ? 'Referral Requests' : 'My Requests'}
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        {isAlumni
          ? 'Students requesting referrals from you.'
          : 'Track your referral requests. Declined ones are automatically refunded.'}
      </p>

      {/* Status filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'pending', 'accepted', 'declined'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>No requests found.</p>
          {!isAlumni && (
            <Link to="/jobs" className="btn-primary mt-4 inline-flex text-sm">Browse Jobs →</Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {isAlumni
            ? requests.map((r) => <ReceivedCard key={r._id} req={r} onRespond={load} />)
            : requests.map((r) => <SentCard key={r._id} req={r} />)
          }
        </div>
      )}
    </div>
  );
}
