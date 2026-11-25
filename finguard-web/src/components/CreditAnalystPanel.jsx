import { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  PlayCircle,
  AlertCircle,
  Sparkles,
  Printer,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Eye
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import RiskBadge from './RiskBadge';
import { QueueCardSkeleton } from './SkeletonLoader';
import { generateLoanReceipt } from '../utils/generateReceipt';
import DocumentPreviewModal from './DocumentPreviewModal';

export default function CreditAnalystPanel({ onDecisionMade }) {
  const { user: currentUser } = useAuth();
  const [loans, setLoans] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notesByLoan, setNotesByLoan] = useState({});
  const [approvedAmountByLoan, setApprovedAmountByLoan] = useState({});
  const [processingId, setProcessingId] = useState(null);

  // Disbursement modal state
  const [disburseLoan, setDisburseLoan] = useState(null);
  const [disburseAmount, setDisburseAmount] = useState('');
  const [disburseRef, setDisburseRef] = useState('');
  const [disbursing, setDisbursing] = useState(false);

  // Documents state by loanId
  const [documentsByLoan, setDocumentsByLoan] = useState({});
  const [expandedDocs, setExpandedDocs] = useState({});
  const [loadingDocs, setLoadingDocs] = useState({});
  const [previewDoc, setPreviewDoc] = useState(null); // { loanId, doc }

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
      const errCode = err.response?.data?.errorCode;
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to load loan underwriting queue.';
      setError(errCode ? `[${errCode}] ${errMsg}` : errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans(page, statusFilter);
  }, [page, statusFilter]);

  const toggleDocs = async (loanId) => {
    const isExpanded = expandedDocs[loanId];
    setExpandedDocs((prev) => ({ ...prev, [loanId]: !isExpanded }));

    if (!isExpanded && !documentsByLoan[loanId]) {
      setLoadingDocs((prev) => ({ ...prev, [loanId]: true }));
      try {
        const { data } = await api.get(`/api/loans/${loanId}/documents`);
        setDocumentsByLoan((prev) => ({ ...prev, [loanId]: data || [] }));
      } catch (err) {
        console.error('Failed to load documents for loan ' + loanId, err);
      } finally {
        setLoadingDocs((prev) => ({ ...prev, [loanId]: false }));
      }
    }
  };

  const handleVerifyDocument = async (loanId, docId, status) => {
    let reviewerNotes = 'Document verified by credit analyst.';
    if (status === 'REJECTED') {
      const noteInput = window.prompt('Enter reason for document rejection:');
      if (!noteInput) return;
      reviewerNotes = noteInput;
    }

    try {
      await api.patch(`/api/documents/${docId}/verify`, {
        status,
        reviewerNotes,
      });

      // Update state locally
      setDocumentsByLoan((prev) => ({
        ...prev,
        [loanId]: (prev[loanId] || []).map((d) =>
          d.id === docId ? { ...d, verificationStatus: status, reviewerNotes } : d
        ),
      }));
      setSuccess(`Document marked as ${status}.`);
    } catch (err) {
      const errCode = err.response?.data?.errorCode;
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to update document status.';
      setError(errCode ? `[${errCode}] ${errMsg}` : errMsg);
    }
  };

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
      alert('Failed to download document: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTransition = async (loanId, newStatus) => {
    setError('');
    setSuccess('');
    const notes = (notesByLoan[loanId] || '').trim();

    if ((newStatus === 'APPROVED' || newStatus === 'REJECTED' || newStatus === 'CORRECTION_REQUIRED') && !notes) {
      setError('Please enter reviewer notes before approving, rejecting, or requesting a correction.');
      return;
    }

    setProcessingId(loanId);
    try {
      const payload = {
        newStatus,
        reviewerNotes: notes || 'Claimed for underwriting review.',
      };
      if (newStatus === 'APPROVED' && approvedAmountByLoan[loanId]) {
        payload.approvedAmount = Number(approvedAmountByLoan[loanId]);
      }
      await api.patch(`/api/loans/${loanId}/status`, payload);
      setSuccess(`Loan #${loanId} updated to ${newStatus}.`);
      setNotesByLoan((prev) => ({ ...prev, [loanId]: '' }));
      fetchLoans(page, statusFilter);
      if (onDecisionMade) {
        onDecisionMade();
      }
    } catch (err) {
      const errCode = err.response?.data?.errorCode;
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Status update failed.';
      setError(errCode ? `[${errCode}] ${errMsg}` : errMsg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRecordDisbursement = async (e) => {
    e.preventDefault();
    if (!disburseLoan) return;
    setDisbursing(true);
    setError('');
    setSuccess('');
    try {
      await api.patch(`/api/loans/${disburseLoan.id}/disburse`, {
        disbursedAmount: Number(disburseAmount),
        reference: disburseRef || `DISB-${Date.now()}`,
      });
      setSuccess(`Disbursed KES ${Number(disburseAmount).toLocaleString()} for Loan #${disburseLoan.id}.`);
      setDisburseLoan(null);
      setDisburseAmount('');
      setDisburseRef('');
      fetchLoans(page, statusFilter);
      if (onDecisionMade) onDecisionMade();
    } catch (err) {
      const errCode = err.response?.data?.errorCode;
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Disbursement failed.';
      setError(errCode ? `[${errCode}] ${errMsg}` : errMsg);
    } finally {
      setDisbursing(false);
    }
  };

  const statusBadge = (status) => {
    const styles = {
      PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
      UNDER_REVIEW: 'bg-indigo-500/15 text-indigo-700 border-indigo-500/30',
      CORRECTION_REQUIRED: 'bg-amber-50 text-amber-700 border-amber-300',
      APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-500/30',
      REJECTED: 'bg-rose-50 text-rose-700 border-red-500/30',
    };
    return styles[status] || styles.PENDING;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/90 shadow-sm rounded-xl p-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-900">Credit Underwriting Queue</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {['', 'PENDING', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'APPROVED', 'REJECTED'].map((status) => (
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
        <div className="space-y-4">
          <QueueCardSkeleton />
          <QueueCardSkeleton />
          <QueueCardSkeleton />
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white border border-slate-200/90 shadow-sm rounded-xl p-10 text-center text-slate-500 text-sm">
          No loan applications match this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const docs = documentsByLoan[loan.id] || [];
            const isDocsExpanded = expandedDocs[loan.id];
            const isDocLoading = loadingDocs[loan.id];
            const isOwnSubmission =
              loan.submittedByEmail &&
              currentUser?.email &&
              loan.submittedByEmail.toLowerCase() === currentUser.email.toLowerCase();

            return (
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
                  <div className="flex items-center gap-2">
                    <RiskBadge level={loan.aiRiskLevel} score={loan.aiRiskScore} />
                    <button
                      onClick={() => generateLoanReceipt(loan)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Receipt
                    </button>
                  </div>
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
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{loan.aiRecommendation}</span>
                </div>

                {/* KYC Documents Collapsible Drawer */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                  <button
                    type="button"
                    onClick={() => toggleDocs(loan.id)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-100/70 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>KYC Proofs & Verification</span>
                      {docs.length > 0 && (
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.2 rounded-full">
                          {docs.length}
                        </span>
                      )}
                    </div>
                    {isDocsExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isDocsExpanded && (
                    <div className="p-3 border-t border-slate-200 bg-white space-y-2">
                      {isDocLoading ? (
                        <div className="text-center py-2 text-xs text-slate-400">Loading documents...</div>
                      ) : docs.length === 0 ? (
                        <div className="text-center py-2 text-xs text-slate-400">No documents attached to this loan.</div>
                      ) : (
                        docs.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-2.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-50"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                              <div className="truncate">
                                <span className="font-semibold text-slate-900">{doc.fileName}</span>
                                <span className="text-[11px] text-slate-500 ml-1.5">({doc.docType})</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  doc.verificationStatus === 'VERIFIED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : doc.verificationStatus === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {doc.verificationStatus}
                              </span>

                              <button
                                onClick={() => setPreviewDoc({ loanId: loan.id, doc })}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold transition cursor-pointer"
                                title="View document in browser"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View</span>
                              </button>

                              <button
                                onClick={() => handleDownloadDoc(loan.id, doc.id, doc.fileName)}
                                className="p-1 rounded-md hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {loan.status === 'UNDER_REVIEW' && doc.verificationStatus !== 'VERIFIED' && (
                                <button
                                  onClick={() => handleVerifyDocument(loan.id, doc.id, 'VERIFIED')}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Verify</span>
                                </button>
                              )}

                              {loan.status === 'UNDER_REVIEW' && doc.verificationStatus !== 'REJECTED' && (
                                <button
                                  onClick={() => handleVerifyDocument(loan.id, doc.id, 'REJECTED')}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-semibold transition"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Action Controls (Four-Eyes Guard) */}
                {isOwnSubmission && (loan.status === 'PENDING' || loan.status === 'UNDER_REVIEW') ? (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Four-Eyes Separation:</strong> You submitted this application, so another analyst must review and decide on it.
                    </span>
                  </div>
                ) : (
                  <>
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
                      <div className="space-y-3 pt-1">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="sm:w-48">
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                              Approved Amount (KES)
                            </label>
                            <input
                              type="number"
                              min="100"
                              value={approvedAmountByLoan[loan.id] ?? loan.requestedAmount}
                              onChange={(e) =>
                                setApprovedAmountByLoan((prev) => ({ ...prev, [loan.id]: e.target.value }))
                              }
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                              Decision / Correction Notes
                            </label>
                            <input
                              type="text"
                              placeholder="Enter underwriting decision or correction notes..."
                              value={notesByLoan[loan.id] || ''}
                              onChange={(e) => setNotesByLoan((prev) => ({ ...prev, [loan.id]: e.target.value }))}
                              className="w-full px-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
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
                            onClick={() => handleTransition(loan.id, 'CORRECTION_REQUIRED')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition cursor-pointer"
                          >
                            <AlertCircle className="w-4 h-4" />
                            Request Correction
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
                  </>
                )}

                {loan.status === 'APPROVED' && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900">
                          Approved: KES {Number(loan.approvedAmount || loan.requestedAmount || 0).toLocaleString()}
                        </span>
                        <span className="font-mono font-semibold text-emerald-700">
                          Disbursed: KES {Number(loan.disbursedAmount || 0).toLocaleString()} (
                          {Math.round(
                            (Number(loan.disbursedAmount || 0) /
                              Math.max(1, Number(loan.approvedAmount || loan.requestedAmount || 1))) *
                              100
                          )}
                          %)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-emerald-200 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              100,
                              (Number(loan.disbursedAmount || 0) /
                                Math.max(1, Number(loan.approvedAmount || loan.requestedAmount || 1))) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    {Number(loan.disbursedAmount || 0) <
                      Number(loan.approvedAmount || loan.requestedAmount || 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          const remaining =
                            Number(loan.approvedAmount || loan.requestedAmount || 0) -
                            Number(loan.disbursedAmount || 0);
                          setDisburseLoan(loan);
                          setDisburseAmount(String(remaining));
                        }}
                        className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer shrink-0"
                      >
                        Record Disbursement
                      </button>
                    )}
                  </div>
                )}

                {(loan.status === 'APPROVED' || loan.status === 'REJECTED') && loan.reviewerNotes && (
                  <p className="text-xs text-slate-500 border-t border-slate-200 pt-2.5">
                    <strong className="text-slate-700">Decision Notes ({loan.reviewedByEmail}):</strong> {loan.reviewerNotes}
                  </p>
                )}
              </div>
            );
          })}
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
      {previewDoc && (
        <DocumentPreviewModal
          loanId={previewDoc.loanId}
          doc={previewDoc.doc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {disburseLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRecordDisbursement}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Record Disbursement — Loan #{disburseLoan.id}
              </h3>
              <button
                type="button"
                onClick={() => setDisburseLoan(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Disbursement Amount (KES)</label>
              <input
                type="number"
                required
                min="1"
                value={disburseAmount}
                onChange={(e) => setDisburseAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transfer Reference</label>
              <input
                type="text"
                value={disburseRef}
                onChange={(e) => setDisburseRef(e.target.value)}
                placeholder="e.g. RTGS-998877"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDisburseLoan(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={disbursing}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer disabled:opacity-50"
              >
                {disbursing ? 'Disbursing...' : 'Confirm Disbursement'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
