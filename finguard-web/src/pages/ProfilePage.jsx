import { useState, useEffect } from 'react';
import { User, Phone, CreditCard, Mail, Lock, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BorrowerNavbar from '../components/BorrowerNavbar';
import api from '../api/axios';
import { extractApiError } from '../utils/extractErrorMessage';

export default function ProfilePage({ embedded = false }) {
  const { user, updateUserProfile, completePasswordChange } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [nationalId, setNationalId] = useState(user?.nationalId || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get('/api/users/me');
        setFullName(data.fullName || '');
        setPhone(data.phone || '');
        setNationalId(data.nationalId || '');
        updateUserProfile(data);
      } catch {
        // Fallback to auth context
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.put('/api/users/me', { fullName, phone, nationalId });
      updateUserProfile(data);
      setSuccess('Profile updated! Your details will now auto-fill on new applications.');
    } catch (err) {
      setError(extractApiError(err, 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPass(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post('/api/auth/change-password', { currentPassword, newPassword });
      if (data.token) completePasswordChange(data.token);
      setCurrentPassword('');
      setNewPassword('');
      setSuccess('Password updated successfully.');
    } catch (err) {
      setError(extractApiError(err, 'Failed to change password.'));
    } finally {
      setChangingPass(false);
    }
  };

  const content = (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
            {(fullName || user?.fullName || 'U').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{fullName || user?.fullName}</h1>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Shield className="w-3 h-3" />
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Personal Details Form */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
          <p className="text-xs text-slate-500">These details auto-fill automatically when submitting applications</p>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading profile...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 700 000 000"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">National ID / Passport</label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="ID-12345678"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving || loading}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* Security / Change Password */}
      <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Security & Password</h2>
          <p className="text-xs text-slate-500">Update your account password anytime</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Password (min 8 chars)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={changingPass}
            className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer"
          >
            {changingPass ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <BorrowerNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:py-8">
        {content}
      </main>
    </div>
  );
}
