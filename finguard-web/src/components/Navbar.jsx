import { LogOut, ShieldCheck, Users, Shield, FileText, ClipboardCheck, Sparkles, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.fullName || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const navItems = {
    ADMIN: [
      { id: 'staff', label: 'Staff Management', icon: Users },
      { id: 'audit', label: 'Audit Logs', icon: Shield },
      { id: 'repayments', label: 'Repayments', icon: CreditCard },
      { id: 'analytics', label: 'AI Analytics', icon: Sparkles },
    ],
    LOAN_OFFICER: [
      { id: 'loans', label: 'Loan Origination', icon: FileText },
      { id: 'repayments', label: 'Repayments', icon: CreditCard },
      { id: 'analytics', label: 'AI Analytics', icon: Sparkles },
    ],
    CREDIT_ANALYST: [
      { id: 'queue', label: 'Underwriting Queue', icon: ClipboardCheck },
      { id: 'repayments', label: 'Repayments', icon: CreditCard },
      { id: 'analytics', label: 'AI Analytics', icon: Sparkles },
    ],
    AUDITOR: [
      { id: 'audit', label: 'Compliance Logs', icon: Shield },
      { id: 'repayments', label: 'Repayments', icon: CreditCard },
      { id: 'analytics', label: 'AI Analytics', icon: Sparkles },
    ],
  }[user?.role] || [];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-base">FinGuard AI</span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab && setActiveTab(id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeTab === id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-3">
          <NotificationBell />

          <div className="hidden sm:flex items-center gap-2.5 pr-3 border-r border-slate-200">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
              {initials}
            </div>
            <div className="leading-tight">
              <div className="text-xs font-semibold text-slate-900">{user?.fullName}</div>
              <div className="text-[11px] font-medium text-indigo-600">{user?.role}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
