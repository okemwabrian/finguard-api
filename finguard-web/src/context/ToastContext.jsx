import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, [removeToast]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    info: <Info className="w-4 h-4 text-indigo-500 shrink-0" />,
  };

  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-100',
    error: 'border-rose-200 bg-rose-50 text-rose-900 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-100',
    warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/90 dark:border-amber-800 dark:text-amber-100',
    info: 'border-indigo-200 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/90 dark:border-indigo-800 dark:text-indigo-100',
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Snackbar / Toast Container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-auto min-w-[260px] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md text-xs font-medium transition-all ${
              styles[t.type] || styles.info
            }`}
          >
            <div>{icons[t.type] || icons.info}</div>
            <div className="flex-1 leading-snug">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="opacity-60 hover:opacity-100 transition cursor-pointer shrink-0"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
