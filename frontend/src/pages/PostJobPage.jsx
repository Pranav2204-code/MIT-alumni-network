import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axios';

const DOMAINS = ['software', 'data', 'cybersecurity', 'devops', 'design', 'product', 'finance', 'marketing', 'other'];

export default function PostJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', company: '', location: '', isRemote: false,
    jobType: 'full_time', domain: 'software',
    description: '', requirements: '',
    salaryMin: '', salaryMax: '',
    skillsRequired: '',
    referralSlots: 5, deadline: '',
    externalLink: '',
  });
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        skillsRequired: form.skillsRequired.split(',').map((s) => s.trim()).filter(Boolean),
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        referralSlots: Number(form.referralSlots),
        deadline: form.deadline || undefined,
      };
      const { data } = await api.post('/jobs', payload);
      toast.success('Job posted!');
      navigate(`/jobs/${data.data.job._id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a Job</h1>
      <form onSubmit={handleSubmit} className="space-y-5 card">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Job Title *</label>
            <input name="title" value={form.title} onChange={onChange} className="input" required placeholder="Software Engineer" />
          </div>
          <div>
            <label className="label">Company *</label>
            <input name="company" value={form.company} onChange={onChange} className="input" required placeholder="Acme Corp" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Location *</label>
            <input name="location" value={form.location} onChange={onChange} className="input" required placeholder="Pune, India" />
          </div>
          <div>
            <label className="label">Job Type *</label>
            <select name="jobType" value={form.jobType} onChange={onChange} className="input">
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input id="remote" name="isRemote" type="checkbox" checked={form.isRemote} onChange={onChange}
            className="h-4 w-4 rounded text-brand-600" />
          <label htmlFor="remote" className="text-sm font-medium text-gray-700">Remote / work-from-home option</label>
        </div>

        <div>
          <label className="label">Domain *</label>
          <select name="domain" value={form.domain} onChange={onChange} className="input">
            {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Description *</label>
          <textarea name="description" value={form.description} onChange={onChange}
            className="input resize-none h-32" required placeholder="What does the role involve? Team, projects, tech stack…" />
        </div>

        <div>
          <label className="label">Requirements</label>
          <textarea name="requirements" value={form.requirements} onChange={onChange}
            className="input resize-none h-24" placeholder="Years of experience, must-have skills, degree expectations…" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Min Salary (₹ p.a.)</label>
            <input name="salaryMin" type="number" value={form.salaryMin} onChange={onChange} className="input" placeholder="500000" />
          </div>
          <div>
            <label className="label">Max Salary (₹ p.a.)</label>
            <input name="salaryMax" type="number" value={form.salaryMax} onChange={onChange} className="input" placeholder="1200000" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Referral Slots</label>
            <input name="referralSlots" type="number" min={1} max={20} value={form.referralSlots} onChange={onChange} className="input" />
            <p className="text-xs text-gray-400 mt-1">Max students you'll refer (max 20)</p>
          </div>
          <div>
            <label className="label">Application Deadline</label>
            <input name="deadline" type="date" value={form.deadline} onChange={onChange} className="input" />
          </div>
        </div>

        <div>
          <label className="label">Skills Required (comma-separated)</label>
          <input name="skillsRequired" value={form.skillsRequired} onChange={onChange}
            className="input" placeholder="React, Node.js, MongoDB, Docker" />
        </div>

        <div>
          <label className="label">External Job Posting URL</label>
          <input name="externalLink" type="url" value={form.externalLink} onChange={onChange}
            className="input" placeholder="https://careers.company.com/job/123" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Posting…' : 'Post Job 🚀'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
