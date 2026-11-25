import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, FileText, ArrowRight, Wallet, CheckCircle, Clock, AlertTriangle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BorrowerNavbar from '../components/BorrowerNavbar';
import RiskBadge from '../components/RiskBadge';
import api from '../api/axios';

export default function BorrowerDashboard() {
  const { user } = useAuth();

  const { data: loans = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['borrower-loans'],
    queryFn: async () => {
      const { data } = await api.get('/api/borrower/loans?page=0&size=20');
      return data.content || [];
    },
    refetchInterval: 10000, // 10s live status updates
  });

  const error = queryError
    ? queryError.response?.data?.message || queryError.response?.data?.error || 'Failed to load your loan applications'
    : '';

  const totalBorrowed = loans
    .filter((l) => l.status === 'APPROVED')
    .reduce((sum, l) => sum + Number(l.requestedAmount || 0), 0);

  const activeLoansCount = loans.filter((l) => l.status === 'APPROVED').length;
  const pendingCount = loans.filter((l) => l.status === 'PENDING' || l.status === 'UNDER_REVIEW').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Under Review</span>;
      case 'CORRECTION_REQUIRED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">Correction Required</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Declined</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pending Review</span>;
    }
  };

  const correctionLoans = loans.filter((l) => l.status === 'CORRECTION_REQUIRED');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <BorrowerNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:py-8 space-y-6">
        {/* Welcome Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Automated Underwriting</span>
            </div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.fullName}!</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Apply for personal and business financing with real-time credit risk scoring and transparent repayment tracking.
            </p>
          </div>

          <Link
            to="/portal/apply"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-semibold text-sm shadow-sm transition shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply for New Loan</span>
          </Link>
        </div>

        {/* Action Required Banner for Corrections */}
        {correctionLoans.length > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  {correctionLoans.length} Application{correctionLoans.length > 1 ? 's' : ''} Require Your Correction
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Our underwriting team requested updates before final approval: "{correctionLoans[0].reviewerNotes}"
                </p>
              </div>
            </div>
            <Link
              to={`/portal/loans/${correctionLoans[0].id}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition shrink-0"
            >
              <span>Fix & Resubmit #{correctionLoans[0].id}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Quick KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Active Approved Volume</div>
              <div className="text-xl font-bold text-slate-900">KES {totalBorrowed.toLocaleString()}</div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Active Facilities</div>
              <div className="text-xl font-bold text-slate-900">{activeLoansCount} active loan(s)</div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500">Applications in Queue</div>
              <div className="text-xl font-bold text-slate-900">{pendingCount} in review</div>
            </div>
          </div>
        </div>

        {/* Loan Applications Section */}
        <div className="rounded-xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Your Loan Applications</h2>
              <p className="text-xs text-slate-500">Monitor decision status, view amortization schedules, and upload KYC proofs</p>
            </div>
            <Link
              to="/portal/apply"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
            >
              <span>New application</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {error && (
            <div className="m-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading your loan records...</div>
          ) : loans.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No loan applications yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Ready to finance your growth? Submit an application and receive instant AI underwriting feedback.
              </p>
              <Link
                to="/portal/apply"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Start Loan Application</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">Loan ID</th>
                    <th className="py-3.5 px-6">Requested Amount</th>
                    <th className="py-3.5 px-6">Term</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">AI Risk Grade</th>
                    <th className="py-3.5 px-6">Submitted</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        #{loan.id}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        KES {Number(loan.requestedAmount).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {loan.repaymentMonths} months @ {loan.interestRate || '12.00'}%
                      </td>
                      <td className="py-3.5 px-6">
                        {getStatusBadge(loan.status)}
                      </td>
                      <td className="py-3.5 px-6">
                        <RiskBadge level={loan.aiRiskLevel} score={loan.aiRiskScore} />
                      </td>
                      <td className="py-3.5 px-6 text-slate-500">
                        {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <Link
                          to={`/portal/loans/${loan.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
