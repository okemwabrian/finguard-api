import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import KpiSummaryCards from '../components/KpiSummaryCards';
import RiskDistributionChart from '../components/RiskDistributionChart';
import AdminPanel from '../components/AdminPanel';
import LoanOfficerPanel from '../components/LoanOfficerPanel';
import CreditAnalystPanel from '../components/CreditAnalystPanel';
import AuditorPanel from '../components/AuditorPanel';
import api from '../api/axios';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(
    user?.role === 'ADMIN'
      ? 'staff'
      : user?.role === 'CREDIT_ANALYST'
      ? 'queue'
      : user?.role === 'AUDITOR'
      ? 'audit'
      : 'loans'
  );

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/api/loans/stats');
      setStats(data);
    } catch {
      // Gracefully handle if stats fail or role restriction
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/60 text-slate-900">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top KPI Metrics Cards */}
        <KpiSummaryCards stats={stats} loading={statsLoading} />

        {/* Gemini AI Risk Distribution Meter & Insights */}
        <RiskDistributionChart stats={stats} loading={statsLoading} />

        {/* Role-Specific Workflows & Panels */}
        {user?.role === 'ADMIN' && (activeTab === 'staff' ? <AdminPanel /> : <AuditorPanel />)}
        {(user?.role === 'LOAN_OFFICER' || user?.role === 'USER') && (
          <LoanOfficerPanel onLoanSubmitted={fetchStats} />
        )}
        {user?.role === 'CREDIT_ANALYST' && (
          <CreditAnalystPanel onDecisionMade={fetchStats} />
        )}
        {user?.role === 'AUDITOR' && <AuditorPanel />}
      </main>
    </div>
  );
}
