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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/60 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
          <span className="font-bold tracking-tight">FinGuard AI</span>
          <span className="ml-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            {user?.role}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 hidden sm:inline">
            {user?.fullName} ({user?.email})
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {user?.role === 'ADMIN' && (
          <>
            <div className="flex gap-2 border-b border-slate-200 pb-3">
              <button
                onClick={() => setAdminTab('staff')}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition cursor-pointer ${
                  adminTab === 'staff'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Staff Management
              </button>
              <button
                onClick={() => setAdminTab('audit')}
                className={`px-4 py-2 text-xs font-medium rounded-lg transition cursor-pointer ${
                  adminTab === 'audit'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
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
