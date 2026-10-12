import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';

function Avatar({ name, size = 10 }) {
  return (
    <div className={`w-${size} h-${size} rounded-full bg-brand-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function UserCard({ user }) {
  return (
    <Link
      to={`/users/${user._id}`}
      className="card flex items-start gap-4 hover:shadow-md transition-shadow"
    >
      <Avatar name={user.fullName} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-900 text-sm">{user.fullName}</p>
          <span className={`badge ${user.role === 'alumni' ? 'badge-blue' : 'badge-green'}`}>
            {user.role}
          </span>
          {user.isVerified && <span className="text-xs text-green-600">✓ Verified</span>}
        </div>
        {user.jobTitle && (
          <p className="text-sm text-gray-600 mt-0.5">{user.jobTitle} {user.company ? `at ${user.company}` : ''}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {user.department} · Class of {user.graduationYear}
        </p>
        {user.bio && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{user.bio}</p>}
      </div>
    </Link>
  );
}

export default function DirectoryPage() {
  const [users, setUsers]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    role: '', department: '', search: '',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filters.role)       params.set('role', filters.role);
      if (filters.department) params.set('department', filters.department);
      if (filters.search)     params.set('search', filters.search);

      const { data } = await api.get(`/users?${params}`);
      setUsers(data.data.users);
      setTotal(data.data.total);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function onFilter(e) {
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
    setPage(1);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Alumni Directory</h1>
      <p className="text-gray-500 text-sm mb-6">Find and connect with MIT-WPU graduates.</p>

      {/* Filters */}
      <div className="card mb-6 flex flex-wrap gap-3">
        <input
          name="search" value={filters.search} onChange={onFilter}
          className="input flex-1 min-w-[180px]" placeholder="Search by name, company, skill…"
        />
        <select name="role" value={filters.role} onChange={onFilter} className="input w-36">
          <option value="">All roles</option>
          <option value="alumni">Alumni</option>
          <option value="student">Student</option>
        </select>
        <select name="department" value={filters.department} onChange={onFilter} className="input w-48">
          <option value="">All departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Cyber Security & Forensics">Cyber Security</option>
          <option value="Information Technology">IT</option>
          <option value="Electronics">Electronics</option>
          <option value="Mechanical">Mechanical</option>
          <option value="Civil">Civil</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">{total} member{total !== 1 ? 's' : ''} found</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {users.map((u) => <UserCard key={u._id} user={u} />)}
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary"
              >← Prev</button>
              <span className="text-sm text-gray-500">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= total}
                className="btn-secondary"
              >Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
