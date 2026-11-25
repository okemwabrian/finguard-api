import { useState, useEffect } from 'react';
import { LogOut, ShieldCheck, Users, Shield, FileText, ClipboardCheck, Sparkles, CreditCard, User, Calculator, Sun, Moon, Menu, X, Mail, PanelsTopLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on tab change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

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
      { id: 'staff', label: 'Users', icon: Users },
      { id: 'site', label: 'Site Settings', icon: PanelsTopLeft },
      { id: 'borrowers', label: 'Contacts', icon: Mail },
      { id: 'queue', label: 'All Loans', icon: ClipboardCheck },
      { id: 'repayments', label: 'Repayments', icon: CreditCard },
      { id: 'calculator', label: 'Calculator', icon: Calculator },
      { id: 'audit', label: 'Audit', icon: Shield },
      { id: 'analytics', label: 'Analytics', icon: Sparkles },
      { id: 'profile', label: 'Profile', icon: User },
    ],
    LOAN_OFFICER: [
      { id: 'loans', label: 'Loans', icon: FileText },
      { id: 'borrowers', label: 'Contacts', icon: Mail },
      { id: 'repayments', label: 'Repayments', icon: CreditCard },
      { id: 'calculator', label: 'Calculator', icon: Calculator },
      { id: 'analytics', label: 'Analytics', icon: Sparkles },
      { id: 'profile', label: 'Profile', icon: User },
    ],
    CREDIT_ANALYST: [
      { id: 'queue', label: 'Queue', icon: ClipboardCheck },
      { id: 'borrowers', label: 'Contacts', icon: Mail },
      { id: 'repayments', label: 'Repayments', icon: CreditCard },
      { id: 'calculator', label: 'Calculator', icon: Calculator },
      { id: 'analytics', label: 'Analytics', icon: Sparkles },
      { id: 'profile', label: 'Profile', icon: User },
    ],
    AUDITOR: [
      { id: 'audit', label: 'Audit', icon: Shield },
      { id: 'borrowers', label: 'Contacts', icon: Mail },
      { id: 'repayments', label: 'Repayments', icon: CreditCard },
      { id: 'calculator', label: 'Calculator', icon: Calculator },
      { id: 'analytics', label: 'Analytics', icon: Sparkles },
      { id: 'profile', label: 'Profile', icon: User },
    ],
  }[user?.role] || [];

  const handleSelectTab = (id) => {
    if (setActiveTab) setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/90 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-950 to-indigo-600 text-white shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base">FinGuard</span>
            </div>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex max-w-[55vw] items-center gap-1 overflow-x-auto">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleSelectTab(id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    activeTab === id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200/70 dark:ring-indigo-700/50'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  aria-current={activeTab === id ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-pressed={theme === 'dark'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <NotificationBell />

            <button
              type="button"
              onClick={() => handleSelectTab('profile')}
              className="hidden sm:flex items-center gap-2.5 pr-3 border-r border-slate-200 dark:border-slate-700 hover:opacity-80 transition cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                {initials}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold text-slate-900 dark:text-white">{user?.fullName}</div>
                <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">{user?.role}</div>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="staff-mobile-navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div
            id="staff-mobile-navigation"
            className="mobile-menu-enter md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 space-y-3 shadow-lg"
          >
            <div className="flex items-center gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {initials}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{user?.fullName}</div>
                <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">{user?.role}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleSelectTab(id)}
                  className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeTab === id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-xs font-semibold cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-950/60 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </header>

      {/* Mobile Bottom Nav */}
      <nav aria-label="Quick navigation" className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700/60 flex justify-around py-1.5 px-1 shadow-lg transition-colors">
        {navItems.slice(0, 5).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleSelectTab(id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
              activeTab === id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500'
            }`}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <Icon className={`w-4.5 h-4.5 ${activeTab === id ? 'scale-110' : ''} transition-transform`} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
