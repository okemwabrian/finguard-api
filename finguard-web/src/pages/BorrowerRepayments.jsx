import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  X
} from 'lucide-react';
import BorrowerNavbar from '../components/BorrowerNavbar';
import api from '../api/axios';

export default function BorrowerRepayments() {
  const [loans, setLoans] = useState([]);
  const [schedulesByLoan, setSchedulesByLoan] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('M-PESA');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/borrower/loans?page=0&size=20');
      const approvedLoans = (data.content || []).filter((l) => l.status === 'APPROVED');
      setLoans(approvedLoans);

      // Load schedule for each approved loan
      const schedMap = {};
      for (const loan of approvedLoans) {
        try {
          const sRes = await api.get(`/api/borrower/loans/${loan.id}/schedule`);
          schedMap[loan.id] = sRes.data;
        } catch {
          // Ignore
        }
      }
      setSchedulesByLoan(schedMap);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load repayments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute next payment due across all loans
  let nextInstallment = null;
  let nextLoan = null;

  for (const loan of loans) {
    const sched = schedulesByLoan[loan.id];
    if (sched?.installments) {
      const pending = sched.installments.find(
        (i) => i.status === 'PENDING' || i.status === 'OVERDUE'
      );
      if (pending) {
        if (!nextInstallment || new Date(pending.dueDate) < new Date(nextInstallment.dueDate)) {
          nextInstallment = pending;
          nextLoan = loan;
        }
      }
    }
  }

  const handleMakePayment = async (e) => {
    e.preventDefault();
    if (!selectedLoanId) return;
    setSubmittingPayment(true);
    try {
      await api.post(`/api/loans/${selectedLoanId}/payments`, {
        amount: Number(paymentAmount),
        paymentReference: paymentRef || `MPESA-${Date.now()}`,
        paymentMethod,
      });
      setPaymentSuccess('Payment recorded successfully!');
      setShowPaymentModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <BorrowerNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loan Repayments & Billing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your amortization schedules, upcoming installment deadlines, and payment history
          </p>
        </div>

        {paymentSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <span>{paymentSuccess}</span>
            <button onClick={() => setPaymentSuccess('')} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Next Due Highlight Banner */}
        {nextInstallment && nextLoan ? (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Next Upcoming Installment</span>
              </div>
              <div className="text-3xl font-bold">
                KES {Number(nextInstallment.installmentAmount).toLocaleString()}
              </div>
              <div className="text-xs text-slate-300">
                Due on <strong>{nextInstallment.dueDate}</strong> • Facility #{nextLoan.id}
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedLoanId(nextLoan.id);
                setPaymentAmount(nextInstallment.installmentAmount);
                setShowPaymentModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-semibold text-sm shadow-sm transition cursor-pointer shrink-0"
            >
              <CreditCard className="w-4 h-4" />
              <span>Make Repayment Now</span>
            </button>
          </div>
        ) : (
          !loading && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">All Accounts Current</h3>
                <p className="text-xs text-slate-500">
                  {loans.length === 0
                    ? 'You do not have any active approved loan facilities.'
                    : 'No pending payments are currently overdue on your active loan facilities.'}
                </p>
              </div>
            </div>
          )
        )}

        {/* Active Loans Schedules */}
        {loans.map((loan) => {
          const sched = schedulesByLoan[loan.id];
          return (
            <div
              key={loan.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600">FACILITY #{loan.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      Approved
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    KES {Number(loan.requestedAmount).toLocaleString()} Principal
                  </h3>
                  <p className="text-xs text-slate-500">
                    {loan.repaymentMonths} Months @ {loan.interestRate || '12.00'}% Annual Rate
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/portal/loans/${loan.id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
                  >
                    <span>Loan Overview</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => {
                      setSelectedLoanId(loan.id);
                      setPaymentAmount(
                        sched?.installments?.[0]?.installmentAmount || '1000'
                      );
                      setShowPaymentModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Facility</span>
                  </button>
                </div>
              </div>

              {/* Installments Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-6">Installment #</th>
                      <th className="py-3 px-6">Due Date</th>
                      <th className="py-3 px-6">Total Amount</th>
                      <th className="py-3 px-6">Principal</th>
                      <th className="py-3 px-6">Interest</th>
                      <th className="py-3 px-6">Balance</th>
                      <th className="py-3 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sched?.installments?.map((inst) => (
                      <tr key={inst.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-6 font-semibold text-slate-800">
                          {inst.installmentNumber} of {sched.totalInstallments}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Record Loan Repayment</h3>
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
                    disabled={submittingPayment}
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition"
                  >
                    {submittingPayment ? 'Processing...' : 'Confirm Repayment'}
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
