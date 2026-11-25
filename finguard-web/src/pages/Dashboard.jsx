import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import KpiSummaryCards from '../components/KpiSummaryCards';
import RiskDistributionChart from '../components/RiskDistributionChart';
import AdminPanel from '../components/AdminPanel';
import LoanOfficerPanel from '../components/LoanOfficerPanel';
import CreditAnalystPanel from '../components/CreditAnalystPanel';
import AuditorPanel from '../components/AuditorPanel';
import AnalyticsPanel from '../components/AnalyticsPanel';
import RepaymentsPanel from '../components/RepaymentsPanel';
import ProfilePage from './ProfilePage';
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:py-8 space-y-6">
        {/* Top KPI Metrics Cards */}
        {activeTab !== 'profile' && <KpiSummaryCards stats={stats} loading={statsLoading} />}

        {/* Risk Distribution Meter & Insights (shown on primary workflow tabs) */}
        {(activeTab === 'loans' || activeTab === 'queue' || activeTab === 'staff') && (
          <RiskDistributionChart stats={stats} loading={statsLoading} />
        )}

        {/* Dynamic Workflow Panels */}
        {activeTab === 'analytics' && <AnalyticsPanel />}
        {activeTab === 'repayments' && <RepaymentsPanel />}
        {activeTab === 'staff' && <AdminPanel />}
        {activeTab === 'audit' && <AuditorPanel />}
        {activeTab === 'loans' && <LoanOfficerPanel onLoanSubmitted={fetchStats} />}
        {activeTab === 'queue' && <CreditAnalystPanel onDecisionMade={fetchStats} />}
        {activeTab === 'profile' && <ProfilePage embedded />}
      </main>
    </div>
  );
}
