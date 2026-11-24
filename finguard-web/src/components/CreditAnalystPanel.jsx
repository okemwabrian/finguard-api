import { useEffect, useState } from 'react';
import { ClipboardCheck, CheckCircle2, XCircle, PlayCircle, AlertCircle, Sparkles } from 'lucide-react';
import api from '../api/axios';
import RiskBadge from './RiskBadge';

export default function CreditAnalystPanel() {
  const [loans, setLoans] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notesByLoan, setNotesByLoan] = useState({});
  const [processingId, setProcessingId] = useState(null);

  const fetchLoans = async (targetPage = page, filter = statusFilter) => {
    setLoading(true);
    setError('');
    try {
      const query = filter
        ? `/api/loans?status=${filter}&page=${targetPage}&size=10`
        : `/api/loans?page=${targetPage}&size=10`;
      const { data } = await api.get(query);
      setLoans(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      setError('Failed to load loan underwriting queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans(page, statusFilter);
  }, [page, statusFilter]);

  const handleTransition = async (loanId, newStatus) => {
    setError('');
    setSuccess('');
    const notes = (notesByLoan[loanId] || '').trim();

    if ((newStatus === 'APPROVED' || newStatus === 'REJECTED') && !notes) {
      setError('Please enter reviewer notes before approving or rejecting a loan.');
      return;
    }

    setProcessingId(loanId);
    try {
      await api.patch(`/api/loans/${loanId}/status`, {
        newStatus,
        reviewerNotes: notes || 'Claimed for underwriting review.',
      });
      setSuccess(`Loan #${loanId} updated to ${newStatus}.`);
      setNotesByLoan((prev) => ({ ...prev, [loanId]: '' }));
      fetchLoans(page, statusFilter);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Status update failed.');
    } finally {
      setProcessingId(null);
    }
  };

  const statusBadge = (status) => {
    const styles = {
      PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
      UNDER_REVIEW: 'bg-indigo-500/15 text-indigo-700 border-indigo-500/30',
      APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-500/30',
      REJECTED: 'bg-rose-50 text-rose-700 border-red-500/30',
    };
    return styles[status] || styles.PENDING;
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

      {/* Header & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/90 shadow-sm rounded-xl p-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-900">Credit Underwriting Queue</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {['', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status || 'ALL'}
              onClick={() => {
                setPage(0);
                setStatusFilter(status);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-50/80 text-slate-500 border-slate-200 hover:text-slate-900'
              }`}
            >
              {status || 'ALL'}
            </button>
          ))}
        </div>
      </div>

      {/* Loan Cards */}
      {loading ? (
        <div className="bg-white border border-slate-200/90 shadow-sm rounded-xl p-10 text-center text-slate-500 text-sm">
          Loading underwriting queue...
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white border border-slate-200/90 shadow-sm rounded-xl p-10 text-center text-slate-500 text-sm">
          No loan applications match this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => (
            <div key={loan.id} className="bg-white border border-slate-200/90 shadow-sm rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono text-slate-500">#{loan.id}</span>
                    <h3 className="text-base font-semibold text-slate-900">{loan.borrowerName}</h3>
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border ${statusBadge(loan.status)}`}>
                      {loan.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    National ID: {loan.borrowerNationalId} • Purpose: {loan.purpose}
                  </p>
                </div>
                <RiskBadge level={loan.aiRiskLevel} score={loan.aiRiskScore} />
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Requested</span>
                  <span className="text-slate-900 font-semibold">KES {Number(loan.requestedAmount).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Term</span>
                  <span className="text-slate-900 font-semibold">{loan.repaymentMonths} months</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Monthly Income</span>
                  <span className="text-emerald-600 font-semibold">KES {Number(loan.monthlyIncome).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Existing Debt</span>
                  <span className="text-amber-600 font-semibold">KES {Number(loan.existingMonthlyDebt).toLocaleString()}</span>
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="flex items-start gap-2 text-xs text-slate-700 bg-indigo-50/70 border border-indigo-100 rounded-lg p-3">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{loan.aiRecommendation}</span>
              </div>

              {/* Action Controls */}
              {loan.status === 'PENDING' && (
                <div className="flex justify-end">
                  <button
                    disabled={processingId === loan.id}
                    onClick={() => handleTransition(loan.id, 'UNDER_REVIEW')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition cursor-pointer"
                  >
                    <PlayCircle className="w-4 h-4" />
                    {processingId === loan.id ? 'Claiming...' : 'Claim & Start Review'}
                  </button>
                </div>
              )}

              {loan.status === 'UNDER_REVIEW' && (
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <input
                    type="text"
                    placeholder="Enter underwriting decision notes..."
                    value={notesByLoan[loan.id] || ''}
                    onChange={(e) => setNotesByLoan((prev) => ({ ...prev, [loan.id]: e.target.value }))}
                    className="flex-1 px-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={processingId === loan.id}
                      onClick={() => handleTransition(loan.id, 'APPROVED')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      disabled={processingId === loan.id}
                      onClick={() => handleTransition(loan.id, 'REJECTED')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {(loan.status === 'APPROVED' || loan.status === 'REJECTED') && loan.reviewerNotes && (
                <p className="text-xs text-slate-500 border-t border-slate-200 pt-2.5">
                  <strong className="text-slate-700">Decision Notes ({loan.reviewedByEmail}):</strong> {loan.reviewerNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 shadow-sm disabled:opacity-40 hover:text-slate-900 cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 shadow-sm disabled:opacity-40 hover:text-slate-900 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
