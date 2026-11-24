import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import AdminPanel from '../components/AdminPanel';
import LoanOfficerPanel from '../components/LoanOfficerPanel';
import CreditAnalystPanel from '../components/CreditAnalystPanel';
import AuditorPanel from '../components/AuditorPanel';

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(
    user?.role === 'ADMIN' ? 'staff' : user?.role === 'CREDIT_ANALYST' ? 'queue' : user?.role === 'AUDITOR' ? 'audit' : 'loans'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/60 text-slate-900">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {user?.role === 'ADMIN' && (activeTab === 'staff' ? <AdminPanel /> : <AuditorPanel />)}
        {(user?.role === 'LOAN_OFFICER' || user?.role === 'USER') && <LoanOfficerPanel />}
        {user?.role === 'CREDIT_ANALYST' && <CreditAnalystPanel />}
        {user?.role === 'AUDITOR' && <AuditorPanel />}
      </main>
    </div>
  );
}
