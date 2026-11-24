import { useEffect, useState } from 'react';
import { UserPlus, Users, ShieldAlert, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    temporaryPassword: '',
    role: 'LOAN_OFFICER',
  });
  const [showTempPassword, setShowTempPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(Array.isArray(data) ? data : (data.content || []));
    } catch (err) {
      setError('Failed to load staff directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOnboard = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/api/admin/users', form);
      setSuccess(`Onboarded ${form.email} as ${form.role}. They must change their password on first login.`);
      setForm({ fullName: '', email: '', temporaryPassword: '', role: 'LOAN_OFFICER' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not onboard staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (staff) => {
    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/admin/users/${staff.id}/status`, { active: !staff.active });
      setSuccess(`${staff.email} is now ${!staff.active ? 'active' : 'suspended'}.`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Onboard Staff Form */}
      <div className="bg-white border border-slate-200/90 shadow-sm rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-900">Onboard New Staff Member</h2>
        </div>

        <form onSubmit={handleOnboard} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            required
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="px-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="email"
            required
            placeholder="Work Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="px-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
          />
          <div className="relative">
            <input
              type={showTempPassword ? 'text' : 'password'}
              required
              minLength={8}
              placeholder="Temp Password (8+ chars)"
              value={form.temporaryPassword}
              onChange={(e) => setForm({ ...form, temporaryPassword: e.target.value })}
              className="w-full pl-3.5 pr-9 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowTempPassword(!showTempPassword)}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-700 transition cursor-pointer"
              title={showTempPassword ? 'Hide password' : 'Show password'}
            >
              {showTempPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="px-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
          >
            <option value="LOAN_OFFICER">LOAN_OFFICER</option>
            <option value="CREDIT_ANALYST">CREDIT_ANALYST</option>
            <option value="AUDITOR">AUDITOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition cursor-pointer"
          >
            {submitting ? 'Creating...' : 'Enroll Staff'}
          </button>
        </form>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white border border-slate-200/90 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">Staff Directory</h2>
          </div>
          <span className="text-xs text-slate-500">{users.length} accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading staff...</td>
                </tr>
              ) : (
                users.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-3.5 font-medium text-slate-900">{staff.fullName}</td>
                    <td className="px-6 py-3.5 text-slate-700">{staff.email}</td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        staff.active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {staff.active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {staff.email !== currentUser?.email ? (
                        <button
                          onClick={() => toggleStatus(staff)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition cursor-pointer ${
                            staff.active
                              ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 border border-emerald-500/30'
                          }`}
                        >
                          {staff.active ? 'Suspend' : 'Reactivate'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Current Admin
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
