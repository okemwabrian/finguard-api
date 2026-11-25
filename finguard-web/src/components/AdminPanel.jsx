import { useEffect, useState } from 'react';
import {
  UserPlus,
  Users,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  Download,
  FileSpreadsheet,
  FileText,
  KeyRound
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TableRowSkeleton } from './SkeletonLoader';
import { extractApiError } from '../utils/extractErrorMessage';
import ConfirmModal from './ConfirmModal';
import AdminUserActivityModal from './AdminUserActivityModal';
import BulkEmailPanel from './BulkEmailPanel';

export default function AdminPanel({ onDataChanged }) {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [inspectingUserId, setInspectingUserId] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false });
  const [confirmLoading, setConfirmLoading] = useState(false);
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

  const handleDelete = (staff) => {
    setConfirmState({
      isOpen: true,
      title: `Delete ${staff.email}?`,
      message:
        'This will permanently delete this user account and any loans/documents they submitted. Audit logs remain intact. This action cannot be undone.',
      confirmLabel: 'Delete User',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmLoading(true);
        setError('');
        setSuccess('');
        try {
          await api.delete(`/api/admin/users/${staff.id}`);
          const msg = `Deleted ${staff.email} and updated portfolio totals.`;
          setSuccess(msg);
          showToast(msg, 'success');
          fetchUsers();
          if (onDataChanged) onDataChanged();
        } catch (err) {
          const msg = extractApiError(err, 'Failed to delete user.');
          setError(msg);
          showToast(msg, 'error');
        } finally {
          setConfirmLoading(false);
          setConfirmState({ isOpen: false });
        }
      },
    });
  };

  const handleResetPassword = (staff) => {
    setConfirmState({
      isOpen: true,
      title: `Reset Password for ${staff.fullName}?`,
      message: `This will reset ${staff.email}'s password to the default "1234", unlock the account, and require a password change on next login.`,
      confirmLabel: 'Reset to 1234',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmLoading(true);
        setError('');
        setSuccess('');
        try {
          const { data } = await api.post(`/api/admin/users/${staff.id}/reset-password`);
          const msg = `Password for ${staff.email} reset to "${data.defaultPassword}".`;
          setSuccess(msg);
          showToast(msg, 'success');
          fetchUsers();
        } catch (err) {
          const msg = extractApiError(err, 'Failed to reset password.');
          setError(msg);
          showToast(msg, 'error');
        } finally {
          setConfirmLoading(false);
          setConfirmState({ isOpen: false });
        }
      },
    });
  };

  const handleExport = async (type, format) => {
    try {
      setError('');
      const url =
        type === 'portfolio'
          ? `/api/reports/portfolio/export?format=${format}`
          : `/api/reports/audit/export?format=${format}`;

      const response = await api.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `finguard-${type}-report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess(`Downloaded ${type} report in ${format.toUpperCase()} format.`);
    } catch (err) {
      setError(`Failed to export ${type} report: ` + (err.response?.data?.message || err.message));
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

      {/* Compliance & Portfolio Reports Export */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            <span>Compliance & Portfolio Reports Export</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate and stream real-time CSV spreadsheets and audit-ready PDF documents
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Portfolio Summary</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Underwriting volume, risk distribution, and loan ledger</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleExport('portfolio', 'csv')}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition cursor-pointer"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => handleExport('portfolio', 'pdf')}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition cursor-pointer"
              >
                PDF
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Audit & Compliance Trail</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Immutable record of all staff status changes & decisions</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleExport('audit', 'csv')}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition cursor-pointer"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => handleExport('audit', 'pdf')}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition cursor-pointer"
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <BulkEmailPanel users={users} />

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
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-slate-900">All System Users & Roles</h2>
            <span className="text-xs font-medium text-slate-500">({users.length} total)</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'USER', 'BORROWER', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'AUDITOR', 'ADMIN'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                  roleFilter === r
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Name & Contact</th>
                <th className="px-6 py-3">National ID</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <>
                  <TableRowSkeleton cols={5} />
                  <TableRowSkeleton cols={5} />
                  <TableRowSkeleton cols={5} />
                  <TableRowSkeleton cols={5} />
                </>
              ) : (
                users
                  .filter((u) => roleFilter === 'ALL' || u.role === roleFilter)
                  .map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-900">{staff.fullName}</div>
                      <div className="text-xs text-slate-500">
                        {staff.email}{staff.phone ? ` • ${staff.phone}` : ''}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {staff.nationalId || '—'}
                    </td>
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
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setInspectingUserId(staff.id)}
                            title="Inspect User Activity, Documents & Edit Loans"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Inspect</span>
                          </button>
                          <button
                            onClick={() => setEditingUser({ ...staff })}
                            title="Edit User"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(staff)}
                            title="Reset Password to Default (1234)"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 transition cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Reset Pass</span>
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

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        variant={confirmState.variant}
        loading={confirmLoading}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ isOpen: false })}
      />

      {inspectingUserId && (
        <AdminUserActivityModal
          userId={inspectingUserId}
          onClose={() => setInspectingUserId(null)}
          onDataChanged={onDataChanged}
        />
      )}
    </div>
  );
}
