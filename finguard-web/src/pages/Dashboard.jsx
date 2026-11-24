import { useState } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '../components/AdminPanel';
import LoanOfficerPanel from '../components/LoanOfficerPanel';
import CreditAnalystPanel from '../components/CreditAnalystPanel';
import AuditorPanel from '../components/AuditorPanel';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [adminTab, setAdminTab] = useState('staff');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/70 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-indigo-400" />
          <span className="font-bold tracking-tight">FinGuard AI</span>
          <span className="ml-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {user?.role}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 hidden sm:inline">
            {user?.fullName} ({user?.email})
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {user?.role === 'ADMIN' && (
          <>
            <div className="flex gap-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => setAdminTab('staff')}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition cursor-pointer ${
                  adminTab === 'staff'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Staff Management
              </button>
              <button
                onClick={() => setAdminTab('audit')}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition cursor-pointer ${
                  adminTab === 'audit'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Compliance Audit Logs
              </button>
            </div>
            {adminTab === 'staff' ? <AdminPanel /> : <AuditorPanel />}
          </>
        )}

        {user?.role === 'LOAN_OFFICER' && <LoanOfficerPanel />}
        {user?.role === 'CREDIT_ANALYST' && <CreditAnalystPanel />}
        {user?.role === 'AUDITOR' && <AuditorPanel />}
      </main>
    </div>
  );
}
