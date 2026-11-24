import { useEffect, useState } from 'react';
import { UserPlus, Users, ShieldAlert, CheckCircle2, AlertCircle, Pencil, Trash2, X, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showTempPassword, setShowTempPassword] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    temporaryPassword: '',
    role: 'LOAN_OFFICER',
  });

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/admin/users');
      setUsers(Array.isArray(data) ? data : (data.content || []));
    } catch {
      setError('Failed to load user directory.');
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
      setSuccess(`Created ${form.email} (${form.role}).`);
      setForm({ fullName: '', email: '', temporaryPassword: '', role: 'LOAN_OFFICER' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.put(`/api/admin/users/${editingUser.id}`, {
        fullName: editingUser.fullName,
        email: editingUser.email,
        role: editingUser.role,
      });
      setSuccess(`Updated ${editingUser.email}.`);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Update failed.');
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
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (staff) => {
    if (!window.confirm(`Permanently delete ${staff.email}?`)) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/api/admin/users/${staff.id}`);
      setSuccess(`Deleted ${staff.email}.`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot delete user (may have linked loan records).');
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

      {/* Create User Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-900">Onboard Staff / Create User</h2>
        </div>

        <form onSubmit={handleOnboard} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            required
            placeholder="Full Name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
          <input
            type="email"
            required
            placeholder="Work Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
          <div className="relative">
            <input
              type={showTempPassword ? 'text' : 'password'}
              required
              minLength={8}
              placeholder="Temp Password (8+ chars)"
              value={form.temporaryPassword}
              onChange={(e) => setForm({ ...form, temporaryPassword: e.target.value })}
              className="w-full pl-3.5 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setShowTempPassword(!showTempPassword)}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              title={showTempPassword ? 'Hide password' : 'Show password'}
            >
              {showTempPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
          >
            <option value="LOAN_OFFICER">LOAN_OFFICER</option>
            <option value="CREDIT_ANALYST">CREDIT_ANALYST</option>
            <option value="AUDITOR">AUDITOR</option>
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER (Borrower)</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition cursor-pointer"
          >
            {submitting ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </div>

      {/* User Directory Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">User & Staff Directory</h2>
          </div>
          <span className="text-xs font-medium text-slate-500">{users.length} accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading users...</td>
                </tr>
              ) : (
                users.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-3.5 font-medium text-slate-900">{staff.fullName}</td>
                    <td className="px-6 py-3.5 text-slate-600">{staff.email}</td>
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                        staff.active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {staff.active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {staff.email !== currentUser?.email ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setEditingUser({ ...staff })}
                            title="Edit"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleStatus(staff)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer border ${
                              staff.active
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {staff.active ? 'Suspend' : 'Reactivate'}
                          </button>
                          <button
                            onClick={() => handleDelete(staff)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 inline-flex items-center gap-1">
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Edit User</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900"
                >
                  <option value="LOAN_OFFICER">LOAN_OFFICER</option>
                  <option value="CREDIT_ANALYST">CREDIT_ANALYST</option>
                  <option value="AUDITOR">AUDITOR</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="USER">USER (Borrower)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
