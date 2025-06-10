import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import Toast from "./Toast";

type ToastVariant = "success" | "error" | "info";

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    variant: ToastVariant;
    duration?: number;
  } | null>(null);

  function showToast(message: string, variant: ToastVariant = "info", duration = 3000) {
    setToast({ message, variant, duration });
    setTimeout(() => setToast(null), duration);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          onClose={() => setToast(null)}
          duration={toast.duration}
          variant={toast.variant}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx.showToast;
}
