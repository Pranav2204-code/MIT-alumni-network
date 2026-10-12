import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';

function JobCard({ job }) {
  return (
    <Link
      to={`/jobs/${job._id}`}
      className="card flex flex-col gap-3 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{job.title}</h3>
          <p className="text-sm text-gray-600">{job.company} · {job.location}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {job.hasSlotsAvailable
            ? <span className="badge-green">Open</span>
            : <span className="badge-gray">Full</span>}
          {job.isRemote && <span className="badge-blue">Remote</span>}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="capitalize">{job.jobType?.replace('_', ' ')}</span>
        <span>·</span>
        <span>{job.domain}</span>
        <span>·</span>
        <span>Posted by {job.postedBy?.fullName}</span>
        <span>·</span>
        <span>{formatDistanceToNow(new Date(job.createdAt))} ago</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">
          {job.referralsFilled}/{job.referralSlots} slots used
        </span>
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full"
            style={{ width: `${Math.min(100, (job.referralsFilled / job.referralSlots) * 100)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

export default function JobBoardPage() {
  const user  = useAuthStore((s) => s.user);
  const [jobs, setJobs]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ domain: '', jobType: '', search: '', isRemote: '' });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (filters.domain)   params.set('domain', filters.domain);
      if (filters.jobType)  params.set('jobType', filters.jobType);
      if (filters.search)   params.set('search', filters.search);
      if (filters.isRemote) params.set('isRemote', filters.isRemote);
      const { data } = await api.get(`/jobs?${params}`);
      setJobs(data.data.jobs);
      setTotal(data.data.total);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  function onFilter(e) {
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
    setPage(1);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Board</h1>
          <p className="text-gray-500 text-sm mt-1">Referral opportunities posted by MIT-WPU alumni.</p>
        </div>
        {(user?.role === 'alumni' || user?.role === 'admin') && (
          <Link to="/jobs/new" className="btn-primary">+ Post Job</Link>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-6 flex flex-wrap gap-3">
        <input
          name="search" value={filters.search} onChange={onFilter}
          className="input flex-1 min-w-[200px]" placeholder="Search jobs…"
        />
        <select name="domain" value={filters.domain} onChange={onFilter} className="input w-40">
          <option value="">All domains</option>
          {['software', 'data', 'cybersecurity', 'devops', 'design', 'product', 'finance', 'marketing', 'other'].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select name="jobType" value={filters.jobType} onChange={onFilter} className="input w-36">
          <option value="">Any type</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="internship">Internship</option>
          <option value="contract">Contract</option>
        </select>
        <select name="isRemote" value={filters.isRemote} onChange={onFilter} className="input w-32">
          <option value="">Location</option>
          <option value="true">Remote</option>
          <option value="false">On-site</option>
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-4">{total} job{total !== 1 ? 's' : ''} found</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-600 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {jobs.length === 0
              ? <p className="text-center text-gray-400 py-16">No jobs found matching your filters.</p>
              : jobs.map((j) => <JobCard key={j._id} job={j} />)
            }
          </div>
          {total > 20 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary">← Prev</button>
              <span className="text-sm text-gray-500">Page {page}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total} className="btn-secondary">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
