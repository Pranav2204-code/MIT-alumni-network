import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';

const SOCIAL_PLATFORMS = ['linkedin', 'github', 'leetcode', 'codeforces', 'hackerrank', 'portfolio'];

export default function SettingsPage() {
  const user    = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [form, setForm] = useState({
    bio:      user?.bio || '',
    location: user?.location || '',
    jobTitle: user?.jobTitle || '',
    company:  user?.company || '',
    cgpa:     user?.cgpa || '',
    techStack: user?.techStack?.join(', ') || '',
    socialLinks: {
      linkedin:   user?.socialLinks?.linkedin   || '',
      github:     user?.socialLinks?.github     || '',
      leetcode:   user?.socialLinks?.leetcode   || '',
      codeforces: user?.socialLinks?.codeforces || '',
      hackerrank: user?.socialLinks?.hackerrank || '',
      portfolio:  user?.socialLinks?.portfolio  || '',
    },
  });
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function onSocialChange(e) {
    setForm((f) => ({
      ...f,
      socialLinks: { ...f.socialLinks, [e.target.name]: e.target.value },
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        techStack: form.techStack.split(',').map((s) => s.trim()).filter(Boolean),
        cgpa: form.cgpa ? Number(form.cgpa) : undefined,
        socialLinks: Object.fromEntries(
          Object.entries(form.socialLinks).filter(([, v]) => !!v)
        ),
      };
      const { data } = await api.patch('/users/me', payload);
      setUser({ ...user, ...data.data.user });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>

      {/* Read-only info */}
      <div className="card mb-6 bg-gray-50">
        <p className="text-sm font-medium text-gray-700 mb-2">University Details (read-only)</p>
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
          <div><span className="font-medium">PRN:</span> {user?.prn}</div>
          <div><span className="font-medium">Role:</span> <span className="capitalize">{user?.role}</span></div>
          <div><span className="font-medium">Department:</span> {user?.department}</div>
          <div><span className="font-medium">Grad Year:</span> {user?.graduationYear}</div>
          <div><span className="font-medium">Email:</span> {user?.email}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Professional Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Job Title</label>
              <input name="jobTitle" value={form.jobTitle} onChange={onChange} className="input" placeholder="Software Engineer" />
            </div>
            <div>
              <label className="label">Company</label>
              <input name="company" value={form.company} onChange={onChange} className="input" placeholder="Google" />
            </div>
            <div>
              <label className="label">Location</label>
              <input name="location" value={form.location} onChange={onChange} className="input" placeholder="Pune, India" />
            </div>
            {user?.role === 'student' && (
              <div>
                <label className="label">CGPA</label>
                <input name="cgpa" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={onChange}
                  className="input" placeholder="8.5" />
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="label">Bio</label>
            <textarea name="bio" value={form.bio} onChange={onChange}
              className="input resize-none h-24" placeholder="A short intro about yourself…" maxLength={500} />
          </div>

          <div className="mt-4">
            <label className="label">Tech Stack (comma-separated)</label>
            <input name="techStack" value={form.techStack} onChange={onChange}
              className="input" placeholder="React, Node.js, Python, Docker" />
          </div>
        </div>

        {/* Social Links */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Social Profiles</h2>
          <div className="space-y-3">
            {SOCIAL_PLATFORMS.map((p) => (
              <div key={p} className="flex items-center gap-3">
                <label className="w-28 text-sm font-medium text-gray-700 capitalize">{p}</label>
                <input
                  name={p}
                  value={form.socialLinks[p]}
                  onChange={onSocialChange}
                  className="input flex-1"
                  placeholder={`https://${p === 'portfolio' ? 'yoursite.com' : `${p}.com/username`}`}
                  type="url"
                />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
