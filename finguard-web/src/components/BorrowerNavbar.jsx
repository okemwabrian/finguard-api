import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, PlusCircle, CreditCard, Sparkles, Calculator, User, Sun, Moon, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';

export default function BorrowerNavbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/portal', label: 'My Loans', icon: LayoutDashboard },
    { to: '/portal/apply', label: 'Apply', icon: PlusCircle },
    { to: '/portal/repayments', label: 'Repayments', icon: CreditCard },
    { to: '/portal/calculator', label: 'Calculator', icon: Calculator },
    { to: '/portal/assistant', label: 'Assistant', icon: Sparkles },
    { to: '/portal/profile', label: 'Profile', icon: User },
  ];

  const initials = (user?.fullName || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-slate-200/90 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link to="/portal" className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-950 to-indigo-600 text-white shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base">FinGuard</span>
              <span className="hidden lg:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                User Portal
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200/70 dark:ring-indigo-700/50'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                );
              })}
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

            <Link
              to="/portal/profile"
              className="hidden sm:flex items-center gap-2.5 pr-3 border-r border-slate-200 dark:border-slate-700 hover:opacity-80 transition"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                {initials}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold text-slate-900 dark:text-white">{user?.fullName}</div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">User Account</div>
              </div>
            </Link>

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
              aria-controls="borrower-mobile-navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div
            id="borrower-mobile-navigation"
            className="mobile-menu-enter md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 space-y-3 shadow-lg"
          >
            <div className="flex items-center gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {initials}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{user?.fullName}</div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">User Account</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-semibold transition ${
                      active
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
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

      {/* Mobile Bottom Navigation */}
      <nav aria-label="Quick navigation" className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-700/60 flex justify-around py-1.5 px-1 shadow-lg transition-colors">
        {navLinks.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-semibold transition ${
                active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${active ? 'scale-110' : ''} transition-transform`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
