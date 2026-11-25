import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  UploadCloud,
  Download,
  Sparkles,
  X
} from 'lucide-react';
import BorrowerNavbar from '../components/BorrowerNavbar';
import RiskBadge from '../components/RiskBadge';
import api from '../api/axios';

export default function BorrowerLoanDetail() {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('M-PESA');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState('');

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('PAYSLIP');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Correction / Resubmit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [resubmitLoading, setResubmitLoading] = useState(false);

  const fetchLoanData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [loanRes, docRes] = await Promise.all([
        api.get(`/api/borrower/loans/${id}`),
        api.get(`/api/loans/${id}/documents`),
      ]);
      setLoan(loanRes.data);
      setDocuments(docRes.data || []);

      // If approved, load repayment schedule
      if (loanRes.data.status === 'APPROVED') {
        try {
          const schedRes = await api.get(`/api/borrower/loans/${id}/schedule`);
          setSchedule(schedRes.data);
        } catch {
          // Schedule may not exist yet
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load loan application');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLoanData();
  }, [fetchLoanData]);

  const handleMakePayment = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    try {
      await api.post(`/api/loans/${id}/payments`, {
        amount: Number(paymentAmount),
        paymentReference: paymentRef || `MANUAL-${Date.now()}`,
        paymentMethod,
      });
      setPaymentSuccess('Payment recorded successfully!');
      setShowPaymentModal(false);
      fetchLoanData();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('docType', uploadDocType);

      await api.post(`/api/loans/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowUploadModal(false);
      setUploadFile(null);
      fetchLoanData();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploadLoading(false);
    }
  };

  const openEditModal = () => {
    setEditForm({
      borrowerName: loan.borrowerName || '',
      borrowerNationalId: loan.borrowerNationalId || '',
      monthlyIncome: loan.monthlyIncome || '',
      existingMonthlyDebt: loan.existingMonthlyDebt || 0,
      requestedAmount: loan.requestedAmount || '',
      repaymentMonths: loan.repaymentMonths || 12,
      purpose: loan.purpose || '',
    });
    setShowEditModal(true);
  };

  const handleResubmitCorrection = async (e) => {
    e.preventDefault();
    setResubmitLoading(true);
    setError('');
    try {
      await api.put(`/api/borrower/loans/${id}/resubmit`, {
        borrowerName: editForm.borrowerName,
        borrowerNationalId: editForm.borrowerNationalId,
        monthlyIncome: Number(editForm.monthlyIncome),
        existingMonthlyDebt: Number(editForm.existingMonthlyDebt),
        requestedAmount: Number(editForm.requestedAmount),
        repaymentMonths: Number(editForm.repaymentMonths),
        purpose: editForm.purpose,
      });
      setPaymentSuccess('Application corrected and resubmitted for underwriting review!');
      setShowEditModal(false);
      fetchLoanData();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to resubmit application');
    } finally {
      setResubmitLoading(false);
    }
  };

  const handleDownloadDoc = async (docId, fileName) => {
    try {
      const response = await api.get(`/api/loans/${id}/documents/${docId}/download`, {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <BorrowerNavbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
          Loading application details...
        </div>
      </div>
    );
  }

  if (error && !loan) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <BorrowerNavbar />
        <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Application Not Found</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <Link
            to="/portal"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal</span>
          </Link>
        </div>
      </div>
    );
  }

  const isApproved = loan?.status === 'APPROVED';
  const isRejected = loan?.status === 'REJECTED';
  const isUnderReview = loan?.status === 'UNDER_REVIEW';
  const isCorrectionRequired = loan?.status === 'CORRECTION_REQUIRED';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <BorrowerNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:py-8 space-y-6">
        {/* Header Breadcrumbs */}
        <div className="flex items-center justify-between">
          <Link
            to="/portal"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Applications</span>
          </Link>

          <span className="text-xs text-slate-400">
            Application Reference: <strong className="text-slate-700">#{loan.id}</strong>
          </span>
        </div>

        {paymentSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <span>{paymentSuccess}</span>
            <button onClick={() => setPaymentSuccess('')} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isCorrectionRequired && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                <span>Correction Requested by Credit Analyst</span>
              </div>
              <p className="text-sm font-semibold text-amber-950">
                {loan.reviewerNotes || 'Please review your application details or KYC documents and resubmit.'}
              </p>
              <p className="text-xs text-amber-700">
                You can update your financial/personal details below or attach updated documents before resubmitting.
              </p>
            </div>
            <button
              onClick={openEditModal}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
            >
              Edit & Resubmit Application
            </button>
          </div>
        )}

        {/* Status Tracker & Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Underwriting Status Lifecycle
          </h2>

          <div className="grid grid-cols-3 gap-2 relative">
            {/* Step 1: Submission */}
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="mt-2 text-xs font-bold text-slate-900">Submitted</span>
              <span className="text-[10px] text-slate-400">
                {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : 'Received'}
              </span>
            </div>

            {/* Step 2: Under Review */}
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                  isApproved || isRejected || isUnderReview
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isApproved || isRejected ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <span className="mt-2 text-xs font-bold text-slate-900">Credit Underwriting</span>
              <span className="text-[10px] text-slate-400">
                {isUnderReview ? 'In Progress' : isApproved || isRejected ? 'Completed' : 'Pending Queue'}
              </span>
            </div>

            {/* Step 3: Decision */}
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                  isApproved
                    ? 'bg-emerald-600 text-white'
                    : isRejected
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isApproved ? <CheckCircle2 className="w-4 h-4" /> : isRejected ? <XCircle className="w-4 h-4" /> : '3'}
              </div>
              <span className="mt-2 text-xs font-bold text-slate-900">
                {isApproved ? 'Approved' : isRejected ? 'Declined' : 'Final Sign-off'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isApproved ? 'Facility Active' : isRejected ? 'Decision Final' : 'Awaiting Review'}
              </span>
            </div>
          </div>
        </div>

        {/* AI Credit Assessment Card & Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Facility Breakdown</h3>
                <p className="text-xs text-slate-500">Core loan terms and applicant parameters</p>
              </div>
              <RiskBadge level={loan.aiRiskLevel} score={loan.aiRiskScore} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Principal</span>
                <div className="text-base font-bold text-indigo-700">
                  KES {Number(loan.requestedAmount).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Tenure</span>
                <div className="text-base font-bold text-slate-800">{loan.repaymentMonths} Months</div>
              </div>
              <div>
                <span className="text-slate-400">Interest Rate</span>
                <div className="text-base font-bold text-slate-800">{loan.interestRate || '12.00'}% p.a.</div>
              </div>
              <div>
                <span className="text-slate-400">Status</span>
                <div className="text-base font-bold text-slate-800">{loan.status}</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Declared Monthly Income:</span>
                <span className="ml-1 font-semibold text-slate-800">
                  KES {Number(loan.monthlyIncome).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Existing Monthly Debt:</span>
                <span className="ml-1 font-semibold text-slate-800">
                  KES {Number(loan.existingMonthlyDebt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* AI Risk Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-indigo-300 text-[11px] font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gemini Underwriting</span>
              </div>
              <div className="mt-2 text-2xl font-bold">
                {loan.aiRiskScore !== null && loan.aiRiskScore !== undefined ? `${loan.aiRiskScore}/100` : 'Evaluating'}
              </div>
              <div className="text-xs text-indigo-200 mt-0.5">
                Risk Classification: <strong>{loan.aiRiskLevel || 'Pending'}</strong>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-indigo-700/60 text-[11px] text-slate-300">
              {loan.status === 'APPROVED'
                ? 'Your loan passed automated multi-dimensional risk thresholds.'
                : loan.status === 'REJECTED'
                ? 'Application did not satisfy current risk tolerance parameters.'
                : 'Application currently awaiting credit officer verification.'}
            </div>
          </div>
        </div>

        {/* KYC Document Verification Hub */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">KYC & Financial Documents</h3>
              <p className="text-xs text-slate-500">Verified by our credit analyst team</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Attach Document</span>
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              No documents uploaded yet. Upload your National ID and Payslip to speed up review.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <div key={doc.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{doc.fileName}</div>
                      <div className="text-[11px] text-slate-400">
                        {doc.docType} • {(doc.sizeBytes / 1024).toFixed(0)} KB
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
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
                      onClick={() => handleDownloadDoc(doc.id, doc.fileName)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition"
                      title="Download document"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Repayment Amortization Schedule (Only for APPROVED loans) */}
        {isApproved && schedule && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Repayment Amortization Schedule</h3>
                <p className="text-xs text-slate-500">
                  Fixed monthly installments calculated using standard actuarial annuity formula
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400">Monthly Installment</span>
                <div className="text-base font-bold text-indigo-700">
                  KES {schedule.installments && schedule.installments[0] ? Number(schedule.installments[0].installmentAmount).toLocaleString() : '—'}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-6">#</th>
                    <th className="py-3 px-6">Due Date</th>
                    <th className="py-3 px-6">Installment</th>
                    <th className="py-3 px-6">Principal</th>
                    <th className="py-3 px-6">Interest</th>
                    <th className="py-3 px-6">Remaining Balance</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {schedule.installments?.map((inst) => (
                    <tr key={inst.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-6 font-semibold text-slate-700">
                        {inst.installmentNumber}
                      </td>
                      <td className="py-3 px-6 text-slate-600">{inst.dueDate}</td>
                      <td className="py-3 px-6 font-bold text-slate-900">
                        KES {Number(inst.installmentAmount).toLocaleString()}
                      </td>
                      <td className="py-3 px-6 text-slate-600">
                        KES {Number(inst.principalComponent).toLocaleString()}
                      </td>
                      <td className="py-3 px-6 text-slate-600">
                        KES {Number(inst.interestComponent).toLocaleString()}
                      </td>
                      <td className="py-3 px-6 text-slate-600">
                        KES {Number(inst.closingBalance).toLocaleString()}
                      </td>
                      <td className="py-3 px-6">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            inst.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700'
                              : inst.status === 'OVERDUE'
                              ? 'bg-rose-50 text-rose-700 font-bold'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {inst.status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        {inst.status !== 'PAID' && (
                          <button
                            onClick={() => {
                              setSelectedInstallment(inst);
                              setPaymentAmount(inst.installmentAmount);
                              setShowPaymentModal(true);
                            }}
                            className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] transition cursor-pointer"
                          >
                            Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Record Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Make Loan Repayment</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleMakePayment} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Repayment Amount (KES)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="M-PESA">M-PESA Mobile Money</option>
                    <option value="BANK_TRANSFER">Direct Bank Wire / EFT</option>
                    <option value="CARD">Debit / Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transaction Reference / Receipt #
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. QK8912JKL4"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition"
                  >
                    {paymentLoading ? 'Confirming...' : 'Confirm Repayment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upload Document Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Attach KYC Document</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadDocument} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Document Category</label>
                  <select
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="NATIONAL_ID">National ID / Passport</option>
                    <option value="PAYSLIP">Salary Payslip</option>
                    <option value="BANK_STATEMENT">Bank Statement</option>
                    <option value="TAX_RETURN">Tax Return</option>
                    <option value="OTHER">Other Supporting Document</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select File (PDF, PNG, JPG)</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadLoading || !uploadFile}
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition"
                  >
                    {uploadLoading ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Edit & Resubmit Correction Modal */}
        {showEditModal && editForm && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Correct & Resubmit Application #{loan.id}</h3>
                  <p className="text-[11px] text-amber-700 mt-0.5">Analyst note: {loan.reviewerNotes}</p>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleResubmitCorrection} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.borrowerName}
                      onChange={(e) => setEditForm({ ...editForm, borrowerName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">National ID</label>
                    <input
                      type="text"
                      required
                      value={editForm.borrowerNationalId}
                      onChange={(e) => setEditForm({ ...editForm, borrowerNationalId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Monthly Income (KES)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editForm.monthlyIncome}
                      onChange={(e) => setEditForm({ ...editForm, monthlyIncome: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Existing Monthly Debt (KES)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editForm.existingMonthlyDebt}
                      onChange={(e) => setEditForm({ ...editForm, existingMonthlyDebt: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Requested Amount (KES)</label>
                    <input
                      type="number"
                      required
                      min="100"
                      value={editForm.requestedAmount}
                      onChange={(e) => setEditForm({ ...editForm, requestedAmount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Repayment Term (Months)</label>
                    <select
                      value={editForm.repaymentMonths}
                      onChange={(e) => setEditForm({ ...editForm, repaymentMonths: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                      <option value="24">24 Months</option>
                      <option value="36">36 Months</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loan Purpose</label>
                  <input
                    type="text"
                    required
                    value={editForm.purpose}
                    onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resubmitLoading}
                    className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold transition cursor-pointer"
                  >
                    {resubmitLoading ? 'Resubmitting...' : 'Resubmit for Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
