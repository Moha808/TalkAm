import { createContext, useContext, useState, useCallback } from "react";
import { cn } from "../utils/helpers";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3500) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    {
      success: (msg) => addToast(msg, "success"),
      error: (msg) => addToast(msg, "error", 5000),
      warning: (msg) => addToast(msg, "warning"),
      info: (msg) => addToast(msg, "info"),
    },
    [addToast]
  );

  // Hack: make toast callable AND have sub-methods
  const toastFn = Object.assign(
    (msg, type) => addToast(msg, type),
    {
      success: (msg) => addToast(msg, "success"),
      error: (msg) => addToast(msg, "error", 5000),
      warning: (msg) => addToast(msg, "warning"),
      info: (msg) => addToast(msg, "info"),
    }
  );

  return (
    <ToastContext.Provider value={toastFn}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: "text-success border-success/30 bg-success/10",
  error: "text-danger border-danger/30 bg-danger/10",
  warning: "text-warning border-warning/30 bg-warning/10",
  info: "text-primary border-primary/30 bg-primary/10",
};

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type] || Info;
        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg animate-slide-in-right",
              colors[toast.type] || colors.info
            )}
          >
            <Icon size={18} className="flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
