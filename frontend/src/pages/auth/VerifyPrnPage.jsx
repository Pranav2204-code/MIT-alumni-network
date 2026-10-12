import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/axios';

export default function VerifyPrnPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ prn: '', fullName: '', dob: '' });
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-prn', form);
      toast.success('PRN verified! Complete your registration.');
      // Pass verified data to next step via location state
      navigate('/register/complete', { state: { verificationData: data.verificationData } });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Verify your identity</h2>
      <p className="text-sm text-gray-500 mb-6">
        Step 1 of 2 — Enter your university details to confirm you're a MIT-WPU graduate.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">PRN (University Roll Number)</label>
          <input
            name="prn" value={form.prn} onChange={onChange}
            className="input uppercase" placeholder="MIT2020CSXXX"
            required maxLength={20}
          />
        </div>
        <div>
          <label className="label">Full Name (as per university records)</label>
          <input
            name="fullName" value={form.fullName} onChange={onChange}
            className="input" placeholder="Pranav Rathi"
            required
          />
        </div>
        <div>
          <label className="label">Date of Birth</label>
          <input
            name="dob" value={form.dob} onChange={onChange}
            type="date" className="input"
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? 'Verifying…' : 'Verify PRN →'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
