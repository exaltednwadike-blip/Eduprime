"use client";

import React, { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

export function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  const icon = (() => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="text-emerald-500" />;
      case "error":
        return <AlertCircle className="text-rose-500" />;
      case "warning":
        return <AlertTriangle className="text-emerald-400" />;
      default:
        return <Info className="text-sky-400" />;
    }
  })();

  return (
    <div className="pointer-events-auto mb-3 w-80 rounded-lg border bg-white/5 px-4 py-3 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1">
          <div className="font-semibold">{toast.title}</div>
          {toast.message && <div className="mt-1 text-sm text-slate-300">{toast.message}</div>}
        </div>
        <button onClick={() => onDismiss(toast.id)} className="-mr-2 rounded p-1 text-slate-300 hover:bg-white/5">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}



