import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle, Eye, EyeOff, Phone, CreditCard } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await register(fullName, email, password, phone, nationalId);
      if (userData.role === 'BORROWER' || userData.role === 'USER') {
        navigate('/portal');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Apply for loans and track your applications in real time"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Grace Wanjiku"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="grace@example.com"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 700 000 000"
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">National ID / SSN</label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="ID-12345678"
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Password (min 8 chars)</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm shadow-sm transition cursor-pointer"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium">or continue with</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={async (res) => {
            try {
              const userData = await loginWithGoogle(res.credential);
              if (userData.role === 'BORROWER' || userData.role === 'USER') {
                navigate('/portal');
              } else {
                navigate('/dashboard');
              }
            } catch (err) {
              setError(err.response?.data?.error || err.response?.data?.message || 'Google sign-in failed');
            }
          }}
          onError={() => setError('Google sign-in was cancelled or failed')}
        />
      </div>

      <p className="text-center text-xs text-slate-500 mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
