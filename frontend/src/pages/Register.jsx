import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'resident',
    apartment_number: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { handleLogin } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.role === 'resident' && !formData.apartment_number) {
      setError('Apartment number is required for residents');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        apartment_number: formData.apartment_number,
        phone: formData.phone,
      });
      handleLogin(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
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
          <div className="absolute top-32 right-16 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-32 left-16 w-96 h-96 bg-brand-400/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 max-w-lg">
          <div className="w-14 h-14 bg-brand-600 rounded-xl flex items-center justify-center mb-8">
            <span className="text-white font-bold text-xl">ST</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Join Your Society
            <span className="block text-brand-400 mt-1">Community</span>
          </h1>
          <p className="text-surface-300 text-lg leading-relaxed">
            Create your account to start raising complaints,
            tracking resolutions, and staying informed about your society.
          </p>
          <div className="mt-12 space-y-4">
            {[
              'Raise complaints with photo attachments',
              'Real-time status tracking',
              'Email notifications on updates',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-brand-400" />
                </div>
                <p className="text-surface-300">{feature}</p>
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
            <h2 className="text-2xl font-bold text-surface-900">Create an account</h2>
            <p className="text-surface-500 mt-1">Fill in the details to get started</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-danger-50 border border-danger-100 rounded-lg flex items-center gap-3">
              <AlertCircle size={18} className="text-danger flex-shrink-0" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                type="text"
                name="name"
                className="input"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                name="email"
                className="input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="label">I am a</label>
              <select
                name="role"
                className="input"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="resident">Resident</option>
                <option value="tenant">Tenant</option>
                <option value="security">Security Guard</option>
              </select>
            </div>

            {formData.role === 'resident' && (
              <div>
                <label className="label">Apartment number</label>
                <input
                  type="text"
                  name="apartment_number"
                  className="input"
                  placeholder="e.g. A-101"
                  value={formData.apartment_number}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div>
              <label className="label">Phone number <span className="text-surface-400 font-normal">(optional)</span></label>
              <input
                type="tel"
                name="phone"
                className="input"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="input pr-11"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
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

            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                name="confirmPassword"
                className="input"
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-brand w-full py-3 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
