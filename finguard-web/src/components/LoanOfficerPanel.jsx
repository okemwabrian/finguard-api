import { useEffect, useState } from 'react';
import { Plus, Sparkles, ClipboardList, AlertCircle, X, ShieldCheck, Printer } from 'lucide-react';
import api from '../api/axios';
import RiskBadge from './RiskBadge';
import { TableRowSkeleton } from './SkeletonLoader';
import { useAuth } from '../context/AuthContext';
import { generateLoanReceipt } from '../utils/generateReceipt';

export default function LoanOfficerPanel({ onLoanSubmitted }) {
  const { user } = useAuth();
  const isBorrower = user?.role === 'USER';

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [latestResult, setLatestResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    borrowerName: isBorrower ? user?.fullName || '' : '',
    borrowerNationalId: '',
    monthlyIncome: '',
    existingMonthlyDebt: '',
    requestedAmount: '',
    repaymentMonths: '12',
    purpose: '',
  });

  const fetchMyLoans = async () => {
    try {
      const { data } = await api.get('/api/loans/my-submissions?page=0&size=15');
      setLoans(data.content || []);
    } catch {
      setError('Failed to load your loan submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLoans();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        monthlyIncome: Number(form.monthlyIncome),
        existingMonthlyDebt: Number(form.existingMonthlyDebt),
        requestedAmount: Number(form.requestedAmount),
        repaymentMonths: Number(form.repaymentMonths),
      };
      const { data } = await api.post('/api/loans', payload);
      setLatestResult(data);
      setIsModalOpen(false);
      setForm({
        borrowerName: isBorrower ? user?.fullName || '' : '',
        borrowerNationalId: '',
        monthlyIncome: '',
        existingMonthlyDebt: '',
        requestedAmount: '',
        repaymentMonths: '12',
        purpose: '',
      });
      fetchMyLoans();
      if (onLoanSubmitted) {
        onLoanSubmitted();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to submit loan application.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status) => {
    const styles = {
      PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
      UNDER_REVIEW: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return styles[status] || styles.PENDING;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Live AI Risk Assessment Result Notification */}
      {latestResult && (
        <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 border border-indigo-200 shadow-xs rounded-xl p-5 relative">
          <button
            onClick={() => setLatestResult(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2 pr-6">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>FinGuard Credit Risk Assessment — {latestResult.borrowerName}</span>
            </div>
            <RiskBadge level={latestResult.aiRiskLevel} score={latestResult.aiRiskScore} />
          </div>
          <p className="text-sm text-slate-700">{latestResult.aiRecommendation}</p>
        </div>
      )}

      {/* Hero Table Card with Header Button */}
      <div className="bg-white border border-slate-200/90 shadow-xs rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {isBorrower ? 'My Loan Applications' : 'Loan Origination Submissions'}
              </h2>
              <p className="text-xs text-slate-500">
                {loans.length} {loans.length === 1 ? 'application recorded' : 'applications recorded'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setError('');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-xs hover:shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Loan Application</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3">Borrower</th>
                <th className="px-6 py-3">Requested Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">AI Risk Assessment</th>
                <th className="px-6 py-3">AI Recommendation</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <>
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                </>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <p className="text-sm font-medium text-slate-700 mb-1">No loan applications yet</p>
                    <p className="text-xs text-slate-400">Click &quot;New Loan Application&quot; to submit your first application.</p>
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-slate-900">{loan.borrowerName}</div>
                      <div className="text-xs text-slate-500">National ID: {loan.borrowerNationalId}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="text-slate-900 font-semibold">
                        KES {Number(loan.requestedAmount).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">{loan.repaymentMonths} months tenure</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusBadge(loan.status)}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <RiskBadge level={loan.aiRiskLevel} score={loan.aiRiskScore} />
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600 max-w-xs">
                      {loan.aiRecommendation || 'Evaluation pending'}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => generateLoanReceipt(loan)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Slide-Over Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    New Loan Application
                  </h3>
                  <p className="text-xs text-slate-500">
                    Submit borrower financials for automated credit evaluation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Borrower Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Sarah Wanjiku"
                    value={form.borrowerName}
                    onChange={(e) => setForm({ ...form, borrowerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    National ID Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 32456789"
                    value={form.borrowerNationalId}
                    onChange={(e) => setForm({ ...form, borrowerNationalId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Income (KES)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="e.g., 120000"
                    value={form.monthlyIncome}
                    onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Existing Monthly Debt (KES)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="e.g., 15000"
                    value={form.existingMonthlyDebt}
                    onChange={(e) => setForm({ ...form, existingMonthlyDebt: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Requested Loan Amount (KES)
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="0.01"
                    placeholder="e.g., 250000"
                    value={form.requestedAmount}
                    onChange={(e) => setForm({ ...form, requestedAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Repayment Tenure (Months)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="360"
                    placeholder="e.g., 12"
                    value={form.repaymentMonths}
                    onChange={(e) => setForm({ ...form, repaymentMonths: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loan Purpose & Business Context
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g., Working capital to expand inventory for retail shop ahead of peak festive season"
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{submitting ? 'Scoring Application...' : 'Submit & Score Loan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
