import { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/axios';
import useAuthStore from '../../store/authStore';

export default function RegisterPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const setUser  = useAuthStore((s) => s.setUser);

  const verificationData = location.state?.verificationData;
  if (!verificationData) return <Navigate to="/register" replace />;

  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match.');
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        prn:      verificationData.prn,
        email:    form.email,
        password: form.password,
      });
      setUser(data.data.user);
      toast.success('Welcome to MIT-WPU Alumni Network! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Create your account</h2>
      <p className="text-sm text-gray-500 mb-4">Step 2 of 2 — Set your login credentials</p>

      {/* Verified info banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-sm">
        <p className="font-medium text-green-800">✓ Verified as {verificationData.fullName}</p>
        <p className="text-green-700 mt-0.5">
          {verificationData.department} · {verificationData.degree} · Class of {verificationData.graduationYear}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email address</label>
          <input
            name="email" type="email" value={form.email} onChange={onChange}
            className="input" placeholder="you@example.com"
            required
          />
          <p className="text-xs text-gray-400 mt-1">Any email works — not just .edu.in</p>
        </div>
        <div>
          <label className="label">Password</label>
          <input
            name="password" type="password" value={form.password} onChange={onChange}
            className="input" placeholder="Min 8 chars, include number & symbol"
            required minLength={8}
          />
        </div>
        <div>
          <label className="label">Confirm Password</label>
          <input
            name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange}
            className="input" placeholder="Repeat password"
            required minLength={8}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? 'Creating account…' : 'Create Account 🚀'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
