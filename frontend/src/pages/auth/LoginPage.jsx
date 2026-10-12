import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function LoginPage() {
  const login    = useAuthStore((s) => s.login);
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Sign in</h2>
      <p className="text-sm text-gray-500 mb-6">Welcome back to the MIT-WPU alumni community.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email address</label>
          <input
            name="email" type="email" value={form.email} onChange={onChange}
            className="input" placeholder="you@example.com"
            required autoComplete="email"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            name="password" type="password" value={form.password} onChange={onChange}
            className="input" placeholder="••••••••"
            required autoComplete="current-password"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        New here?{' '}
        <Link to="/register" className="text-brand-600 font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
