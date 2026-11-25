import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  DollarSign,
  X,
  AlertCircle
} from 'lucide-react';
import api from '../api/axios';

export default function RepaymentsPanel() {
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all' | 'delinquent'
  const [loans, setLoans] = useState([]);
  const [delinquentLoans, setDelinquentLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [installmentNumber, setInstallmentNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('M-PESA');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [loansRes, delinqRes] = await Promise.all([
        api.get('/api/loans?status=APPROVED&page=0&size=50'),
        api.get('/api/loans/delinquent'),
      ]);
      setLoans(loansRes.data.content || []);
      setDelinquentLoans(
        Array.isArray(delinqRes.data) ? delinqRes.data : (delinqRes.data?.content || [])
      );
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load repayments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedLoan) return;

    setSubmittingPayment(true);
    setError('');
    setSuccess('');

    try {
      await api.post(`/api/loans/${selectedLoan.id}/payments`, {
        amount: Number(paymentAmount),
        installmentNumber: installmentNumber ? Number(installmentNumber) : null,
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        method: paymentMethod,
      });
      setSuccess(`Recorded payment of KES ${Number(paymentAmount).toLocaleString()} for Loan #${selectedLoan.id}`);
      setShowPaymentModal(false);
      setSelectedLoan(null);
      setPaymentAmount('');
      setInstallmentNumber('');
      fetchData();
    } catch (err) {
      const errCode = err.response?.data?.errorCode;
      const errMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to record payment';
      setError(errCode ? `[${errCode}] ${errMsg}` : errMsg);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const displayList = activeSubTab === 'delinquent' ? delinquentLoans : loans;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Portfolio Repayment Operations</h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor active schedules, record customer cash/wire collections, and mitigate delinquent accounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveSubTab('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeSubTab === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Loans ({loans.length})
            </button>
            <button
              onClick={() => setActiveSubTab('delinquent')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                activeSubTab === 'delinquent'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Delinquent ({delinquentLoans.length})</span>
            </button>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {activeSubTab === 'delinquent' ? 'Delinquent Accounts Requiring Collection' : 'Performing Approved Facilities'}
          </span>
          <span className="text-xs text-slate-400">Showing {displayList.length} records</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading repayment records...</div>
        ) : displayList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            {activeSubTab === 'delinquent'
              ? 'No delinquent loans! The portfolio is fully performing.'
              : 'No approved loans found in this filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Facility #</th>
                  <th className="py-3.5 px-6">Borrower</th>
                  <th className="py-3.5 px-6">Principal</th>
                  <th className="py-3.5 px-6">Term</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Delinquency Flag</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayList.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      #{loan.id}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="font-semibold text-slate-900">{loan.borrowerName}</div>
                      <div className="text-[11px] text-slate-400">ID: {loan.borrowerNationalId}</div>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      KES {Number(loan.requestedAmount).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {loan.repaymentMonths} Months @ {loan.interestRate || '12.00'}%
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        {loan.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      {loan.delinquent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>DELINQUENT</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Performing</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedLoan(loan);
                          setPaymentAmount('');
                          setShowPaymentModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Record Borrower Payment</h3>
                <p className="text-[11px] text-slate-500">
                  Facility #{selectedLoan.id} • {selectedLoan.borrowerName}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount (KES)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Channel</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="M-PESA">M-PESA Paybill / STK Push</option>
                  <option value="BANK_TRANSFER">Bank Wire / RTGS</option>
                  <option value="CHEQUE">Bank Cheque</option>
                  <option value="CASH">Cash Counter Collection</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Installment # (Optional — auto-picks next due if blank)
                </label>
                <input
                  type="number"
                  min="1"
                  value={installmentNumber}
                  onChange={(e) => setInstallmentNumber(e.target.value)}
                  placeholder="Auto-select next unpaid installment"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
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
                  disabled={submittingPayment}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition"
                >
                  {submittingPayment ? 'Recording...' : 'Apply Payment to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
