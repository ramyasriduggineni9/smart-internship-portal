import React, { createContext, useCallback, useContext, useState } from 'react';
import ReactDOM from 'react-dom';

type ToastType = 'info' | 'success' | 'error' | 'warn';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

let _counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++_counter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const bgColor = (type: ToastType) => {
    if (type === 'success') return 'var(--good)';
    if (type === 'error') return 'var(--bad)';
    if (type === 'warn') return 'var(--warn)';
    return 'var(--ink)';
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {ReactDOM.createPortal(
        <div className="toast-wrap">
          {toasts.map(t => (
            <div
              key={t.id}
              className="toast"
              style={{ background: bgColor(t.type) }}
            >
              {t.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export default ToastProvider;
