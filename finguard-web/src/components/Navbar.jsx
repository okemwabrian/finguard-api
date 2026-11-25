import { useState } from 'react';
import { LogOut, ShieldCheck, Users, Shield, FileText, ClipboardCheck, Sparkles, CreditCard, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      { id: 'staff', label: 'Staff', icon: Users },
      { id: 'audit', label: 'Audit', icon: Shield },
      { id: 'repayments', label: 'Repayments', icon: CreditCard },
      { id: 'analytics', label: 'Ask AI', icon: Sparkles },
    ],
    LOAN_OFFICER: [
      { id: 'loans', label: 'Loans', icon: FileText },
      { id: 'repayments', label: 'Repayments', icon: CreditCard },
      { id: 'analytics', label: 'Ask AI', icon: Sparkles },
    ],
    CREDIT_ANALYST: [
      { id: 'queue', label: 'Queue', icon: ClipboardCheck },
      { id: 'repayments', label: 'Repayments', icon: CreditCard },
      { id: 'analytics', label: 'Ask AI', icon: Sparkles },
    ],
    AUDITOR: [
      { id: 'audit', label: 'Audit', icon: Shield },
      { id: 'repayments', label: 'Repayments', icon: CreditCard },
      { id: 'analytics', label: 'Ask AI', icon: Sparkles },
    ],
  }[user?.role] || [];

  const handleSelectTab = (id) => {
    if (setActiveTab) setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-950 to-indigo-600 text-white shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-base">FinGuard AI</span>
            </div>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleSelectTab(id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === id
                      ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* User Profile, Notifications & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
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
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 shadow-lg">
            <div className="flex items-center gap-3 pb-2.5 border-b border-slate-100">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                {initials}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">{user?.fullName}</div>
                <div className="text-[11px] font-medium text-indigo-600">{user?.role}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleSelectTab(id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 flex justify-around py-1.5 px-2 shadow-lg">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleSelectTab(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
              activeTab === id ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
