import { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axios';

// ── Stats tab ─────────────────────────────────────────────────────────────────
function AdminStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data.data));
  }, []);

  if (!stats) return <div className="animate-pulse text-gray-400 py-10 text-center">Loading…</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Total Users',      value: stats.users.total },
        { label: 'Alumni',           value: stats.users.alumni },
        { label: 'Students',         value: stats.users.students },
        { label: 'Pending Verify',   value: stats.verifications.pending },
        { label: 'Total Referrals',  value: stats.referrals.total },
        { label: 'Accepted',         value: stats.referrals.accepted },
        { label: 'Points Issued',    value: stats.points.totalIssued },
      ].map(({ label, value }) => (
        <div key={label} className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Users tab ─────────────────────────────────────────────────────────────────
function AdminUsers() {
  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    const q = search ? `?search=${search}` : '';
    api.get(`/admin/users${q}`).then(({ data }) => setUsers(data.data.users)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function toggleVerify(user) {
    await api.patch(`/admin/users/${user._id}/verify`, { isVerified: !user.isVerified });
    toast.success(`User ${user.isVerified ? 'unverified' : 'verified'}`);
    load();
  }

  async function toggleActive(user) {
    await api.patch(`/admin/users/${user._id}/toggle-active`);
    toast.success(`Account ${user.isActive ? 'suspended' : 'reinstated'}`);
    load();
  }

  return (
    <div>
      <div className="flex gap-3 mb-5">
        <input
          className="input flex-1"
          placeholder="Search by name, email, PRN…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <button onClick={load} className="btn-secondary">Search</button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="pr-4">PRN</th>
                <th className="pr-4">Role</th>
                <th className="pr-4">Points</th>
                <th className="pr-4">Verified</th>
                <th className="pr-4">Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="py-2.5 pr-4 font-medium">{u.fullName}</td>
                  <td className="pr-4 font-mono text-xs">{u.prn}</td>
                  <td className="pr-4 capitalize">{u.role}</td>
                  <td className="pr-4">🪙 {u.referralPoints}</td>
                  <td className="pr-4">
                    <span className={`badge ${u.isVerified ? 'badge-green' : 'badge-gray'}`}>
                      {u.isVerified ? '✓' : '—'}
                    </span>
                  </td>
                  <td className="pr-4">
                    <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="flex gap-2 py-2">
                    {u.role === 'alumni' && (
                      <button onClick={() => toggleVerify(u)} className="text-xs text-brand-600 hover:underline">
                        {u.isVerified ? 'Unverify' : 'Verify'}
                      </button>
                    )}
                    <button onClick={() => toggleActive(u)} className="text-xs text-red-500 hover:underline">
                      {u.isActive ? 'Suspend' : 'Reinstate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main Admin Shell ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const tabs = [
    { to: '/admin',        label: 'Stats',  end: true },
    { to: '/admin/users',  label: 'Users' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((t) => (
          <NavLink
            key={t.to} to={t.to} end={t.end}
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <Routes>
        <Route index element={<AdminStats />} />
        <Route path="users" element={<AdminUsers />} />
      </Routes>
    </div>
  );
}
