import { useEffect, useState } from 'react';
import { FilePlus2, Sparkles, ClipboardList, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import RiskBadge from './RiskBadge';

export default function LoanOfficerPanel() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [latestResult, setLatestResult] = useState(null);

  const [form, setForm] = useState({
    borrowerName: '',
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
    } catch (err) {
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
    setLatestResult(null);
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
      setForm({
        borrowerName: '',
        borrowerNationalId: '',
        monthlyIncome: '',
        existingMonthlyDebt: '',
        requestedAmount: '',
        repaymentMonths: '12',
        purpose: '',
      });
      fetchMyLoans();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit loan application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live AI Risk Assessment Result Card */}
      {latestResult && (
        <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Gemini AI Credit Risk Assessment — {latestResult.borrowerName}</span>
            </div>
            <RiskBadge level={latestResult.aiRiskLevel} score={latestResult.aiRiskScore} />
          </div>
          <p className="text-sm text-slate-300">{latestResult.aiRecommendation}</p>
        </div>
      )}

      {/* New Loan Application Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <FilePlus2 className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">New Loan Application</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            required
            placeholder="Borrower Full Name"
            value={form.borrowerName}
            onChange={(e) => setForm({ ...form, borrowerName: e.target.value })}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            required
            placeholder="National ID Number"
            value={form.borrowerNationalId}
            onChange={(e) => setForm({ ...form, borrowerNationalId: e.target.value })}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <input
            type="number"
            required
            min="1"
            step="0.01"
            placeholder="Monthly Income (KES)"
            value={form.monthlyIncome}
            onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <input
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="Existing Monthly Debt (KES)"
            value={form.existingMonthlyDebt}
            onChange={(e) => setForm({ ...form, existingMonthlyDebt: e.target.value })}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <input
            type="number"
            required
            min="1000"
            step="0.01"
            placeholder="Requested Loan Amount (KES)"
            value={form.requestedAmount}
            onChange={(e) => setForm({ ...form, requestedAmount: e.target.value })}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <input
            type="number"
            required
            min="1"
            max="360"
            placeholder="Repayment Months"
            value={form.repaymentMonths}
            onChange={(e) => setForm({ ...form, repaymentMonths: e.target.value })}
            className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            required
            placeholder="Loan Purpose (e.g., Expand hardware shop inventory)"
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            className="md:col-span-2 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition cursor-pointer"
          >
            {submitting ? 'Scoring with Gemini AI...' : 'Submit & Score Loan'}
          </button>
        </form>
      </div>

      {/* My Submitted Loans Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">My Submitted Loans</h2>
          </div>
          <span className="text-xs text-slate-400">{loans.length} applications</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Borrower</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">AI Risk</th>
                <th className="px-6 py-3">AI Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400">Loading applications...</td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No loans submitted yet.</td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-white">{loan.borrowerName}</div>
                      <div className="text-xs text-slate-500">ID: {loan.borrowerNationalId}</div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-200 font-medium">
                      KES {Number(loan.requestedAmount).toLocaleString()}
                      <div className="text-xs text-slate-500">{loan.repaymentMonths} mos</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <RiskBadge level={loan.aiRiskLevel} score={loan.aiRiskScore} />
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-400 max-w-xs">
                      {loan.aiRecommendation}
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
