import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { handleLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      handleLogin(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 to-surface-900" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-16 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-16 w-96 h-96 bg-brand-400/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 max-w-lg">
          <div className="w-14 h-14 bg-brand-600 rounded-xl flex items-center justify-center mb-8">
            <span className="text-white font-bold text-xl">ST</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Society Maintenance
            <span className="block text-brand-400 mt-1">Tracker</span>
          </h1>
          <p className="text-surface-300 text-lg leading-relaxed">
            Streamline complaint management for your apartment society.
            Track, resolve, and manage maintenance requests efficiently.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { value: '11+', label: 'API Endpoints' },
              { value: '8', label: 'Pages' },
              { value: '100%', label: 'Responsive' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-surface-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ST</span>
            </div>
            <span className="text-xl font-bold text-surface-900">SocietyTracker</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-surface-900">Welcome back</h2>
            <p className="text-surface-500 mt-1">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-danger-50 border border-danger-100 rounded-lg flex items-center gap-3">
              <AlertCircle size={18} className="text-danger flex-shrink-0" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-11"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-brand w-full py-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Create one
            </Link>
          </p>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-surface-50 rounded-xl border border-surface-100">
            <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">Demo Accounts</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-surface-600">Resident</span>
                <code className="text-xs bg-surface-100 px-2 py-1 rounded font-mono text-surface-700">
                  resident@example.com
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-surface-600">Admin</span>
                <code className="text-xs bg-surface-100 px-2 py-1 rounded font-mono text-surface-700">
                  admin@example.com
                </code>
              </div>
              <p className="text-xs text-surface-400 pt-1">Password: <span className="font-mono">password123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
