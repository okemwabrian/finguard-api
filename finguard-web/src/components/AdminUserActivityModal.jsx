import { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Download,
  Check,
  Pencil,
  Shield,
  ClipboardList,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { extractApiError } from '../utils/extractErrorMessage';
import RiskBadge from './RiskBadge';

export default function AdminUserActivityModal({ userId, onClose, onDataChanged }) {
  const { showToast } = useToast();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('loans'); // 'loans' | 'documents' | 'audit'
  const [editingLoan, setEditingLoan] = useState(null);
  const [savingLoan, setSavingLoan] = useState(false);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/admin/users/${userId}/activity`);
      setActivity(data);
    } catch (err) {
      showToast(extractApiError(err, 'Failed to load user activity.'), 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchActivity();
  }, [userId]);

  const handleDownloadDoc = async (loanId, docId, fileName) => {
    try {
      const response = await api.get(`/api/loans/${loanId}/documents/${docId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast(extractApiError(err, 'Failed to download document.'), 'error');
    }
  };

  const handleVerifyDoc = async (docId, status) => {
    try {
      await api.patch(`/api/documents/${docId}/verify`, {
        status,
        notes: status === 'VERIFIED' ? 'Verified by Administrator' : 'Rejected by Administrator',
      });
      showToast(`Document marked as ${status}.`, 'success');
      fetchActivity();
    } catch (err) {
      showToast(extractApiError(err, 'Failed to update document status.'), 'error');
    }
  };

  const handleSaveLoan = async (e) => {
    e.preventDefault();
    setSavingLoan(true);
    try {
      await api.put(`/api/admin/loans/${editingLoan.id}`, {
        requestedAmount: Number(editingLoan.requestedAmount),
        repaymentMonths: Number(editingLoan.repaymentMonths),
        interestRate: Number(editingLoan.interestRate),
        purpose: editingLoan.purpose,
        status: editingLoan.status,
        reviewerNotes: editingLoan.reviewerNotes,
      });
      showToast(`Loan #${editingLoan.id} updated successfully.`, 'success');
      setEditingLoan(null);
      fetchActivity();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      showToast(extractApiError(err, 'Failed to update loan.'), 'error');
    } finally {
      setSavingLoan(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {activity?.user ? `${activity.user.fullName} — Activity & Portal Inspector` : 'Loading User Activity...'}
            </h3>
            {activity?.user && (
              <p className="text-xs text-slate-500">
                {activity.user.email} • Role: <strong className="text-indigo-600">{activity.user.role}</strong>
                {activity.user.phone ? ` • ${activity.user.phone}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex gap-2 bg-white">
          {[
            { id: 'loans', label: `Loans (${activity?.submittedLoans?.length || 0})`, icon: ClipboardList },
            { id: 'documents', label: `Documents (${activity?.documents?.length || 0})`, icon: FileText },
            { id: 'audit', label: `Audit Trail (${activity?.auditLogs?.length || 0})`, icon: Shield },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
                activeTab === id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading user data...</div>
          ) : (
            <>
              {/* LOANS TAB */}
              {activeTab === 'loans' && (
                <div className="space-y-3">
                  {activity?.submittedLoans?.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No loans submitted or owned by this user.
                    </div>
                  ) : (
                    activity?.submittedLoans?.map((loan) => (
                      <div key={loan.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-500">#{loan.id}</span>
                            <span className="text-sm font-bold text-slate-900">
                              KES {Number(loan.requestedAmount).toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({loan.repaymentMonths} mo @ {loan.interestRate || '12.00'}%)
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {loan.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <RiskBadge level={loan.aiRiskLevel} score={loan.aiRiskScore} />
                            <button
                              onClick={() => setEditingLoan({ ...loan })}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              Edit Loan
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600">
                          <strong>Purpose:</strong> {loan.purpose}
                          {loan.reviewerNotes && (
                            <span className="ml-3">• <strong>Notes:</strong> {loan.reviewerNotes}</span>
                          )}
                        </p>
                      </div>
                    ))
                  )}

                  {activity?.reviewedLoans?.length > 0 && (
                    <div className="pt-4 border-t border-slate-200 space-y-2">
                      <h4 className="text-xs font-bold uppercase text-slate-500">
                        Loans Reviewed by This Staff Member ({activity.reviewedLoans.length})
                      </h4>
                      {activity.reviewedLoans.map((loan) => (
                        <div key={loan.id} className="p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                          <span>
                            <strong>#{loan.id}</strong> — {loan.borrowerName} (KES {Number(loan.requestedAmount).toLocaleString()})
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {loan.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {activeTab === 'documents' && (
                <div className="space-y-2.5">
                  {activity?.documents?.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No documents uploaded by this user.
                    </div>
                  ) : (
                    activity?.documents?.map((doc) => (
                      <div key={doc.id} className="p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <div>
                            <div className="font-semibold text-slate-900">{doc.fileName}</div>
                            <div className="text-[11px] text-slate-500">
                              Loan #{doc.loanId} • {doc.docType} • {(doc.sizeBytes / 1024).toFixed(0)} KB
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            doc.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : doc.verificationStatus === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {doc.verificationStatus}
                          </span>

                          <button
                            onClick={() => handleDownloadDoc(doc.loanId, doc.id, doc.fileName)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                            title="Download Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {doc.verificationStatus !== 'VERIFIED' && (
                            <button
                              onClick={() => handleVerifyDoc(doc.id, 'VERIFIED')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Verify
                            </button>
                          )}
                          {doc.verificationStatus !== 'REJECTED' && (
                            <button
                              onClick={() => handleVerifyDoc(doc.id, 'REJECTED')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold cursor-pointer"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* AUDIT TRAIL TAB */}
              {activeTab === 'audit' && (
                <div className="space-y-2">
                  {activity?.auditLogs?.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No audit actions recorded for this user.
                    </div>
                  ) : (
                    activity?.auditLogs?.map((log) => (
                      <div key={log.id} className="p-3 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-indigo-600 mr-2">{log.action}</span>
                          <span className="text-slate-700">{log.details}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 shrink-0">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Inline Loan Editor Modal */}
        {editingLoan && (
          <div className="fixed inset-0 z-[95] bg-slate-900/50 flex items-center justify-center p-4">
            <form onSubmit={handleSaveLoan} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-sm font-bold text-slate-900">Admin Update Loan #{editingLoan.id}</h4>
                <button type="button" onClick={() => setEditingLoan(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={editingLoan.requestedAmount}
                    onChange={(e) => setEditingLoan({ ...editingLoan, requestedAmount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Term (Months)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingLoan.repaymentMonths}
                    onChange={(e) => setEditingLoan({ ...editingLoan, repaymentMonths: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    required
                    step="0.5"
                    value={editingLoan.interestRate || 12}
                    onChange={(e) => setEditingLoan({ ...editingLoan, interestRate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingLoan.status}
                    onChange={(e) => setEditingLoan({ ...editingLoan, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="CORRECTION_REQUIRED">CORRECTION_REQUIRED</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purpose</label>
                <input
                  type="text"
                  value={editingLoan.purpose || ''}
                  onChange={(e) => setEditingLoan({ ...editingLoan, purpose: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admin Notes</label>
                <input
                  type="text"
                  value={editingLoan.reviewerNotes || ''}
                  onChange={(e) => setEditingLoan({ ...editingLoan, reviewerNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingLoan(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={savingLoan} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer disabled:opacity-50">
                  {savingLoan ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
