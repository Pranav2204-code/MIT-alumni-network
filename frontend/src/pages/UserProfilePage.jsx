import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';

const SOCIAL_ICONS = {
  linkedin: { icon: '💼', label: 'LinkedIn' },
  github:   { icon: '🐱', label: 'GitHub' },
  leetcode: { icon: '💻', label: 'LeetCode' },
  codeforces: { icon: '⚡', label: 'Codeforces' },
  hackerrank: { icon: '🟩', label: 'HackerRank' },
  portfolio:  { icon: '🌐', label: 'Portfolio' },
};

export default function UserProfilePage() {
  const { id }   = useParams();
  const me       = useAuthStore((s) => s.user);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/${id}`).then(({ data }) => {
      setUser(data.data.user);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }
  if (!user) return <p className="text-center text-gray-400 py-20">User not found.</p>;

  const socialLinks = Object.entries(user.socialLinks || {}).filter(([, v]) => !!v);
  const isOwnProfile = me?._id === user._id;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header card */}
      <div className="card mb-5">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user.fullName?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>
              <span className={`badge ${user.role === 'alumni' ? 'badge-blue' : 'badge-green'}`}>
                {user.role}
              </span>
              {user.isVerified && <span className="text-xs text-green-600 font-medium">✓ Verified</span>}
            </div>
            {user.jobTitle && (
              <p className="text-gray-600 mt-1">{user.jobTitle}{user.company ? ` @ ${user.company}` : ''}</p>
            )}
            <p className="text-sm text-gray-400 mt-1">
              {user.department} · Class of {user.graduationYear}
              {user.location ? ` · 📍 ${user.location}` : ''}
            </p>
          </div>
          {isOwnProfile && (
            <Link to="/settings" className="btn-secondary text-xs flex-shrink-0">Edit</Link>
          )}
        </div>

        {user.bio && <p className="text-sm text-gray-600 mt-4 leading-relaxed">{user.bio}</p>}

        {user.cgpa && (
          <p className="text-sm text-gray-500 mt-2">CGPA: <span className="font-medium">{user.cgpa}</span></p>
        )}

        {user.techStack?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {user.techStack.map((t) => (
              <span key={t} className="badge badge-gray">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Social links */}
      {socialLinks.length > 0 && (
        <div className="card mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Profiles & Links</h2>
          <div className="flex flex-wrap gap-3">
            {socialLinks.map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-brand-700 hover:text-brand-900 bg-brand-50 px-3 py-1.5 rounded-full"
              >
                <span>{SOCIAL_ICONS[platform]?.icon}</span>
                {SOCIAL_ICONS[platform]?.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
