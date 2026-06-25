"use client";

import React, { createContext, useContext, useCallback, useState } from "react";
import { ToastContainer, ToastItem, ToastType } from "./Toast";

type ShowToastArgs = { type: ToastType; title: string; message?: string };

const ToastContext = createContext({
  showToast: (args: ShowToastArgs) => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(({ type, title, message }: ShowToastArgs) => {
    const id = Date.now().toString();
    const toast: ToastItem = { id, type, title, message };
    setToasts((t) => [toast, ...t]);
    // auto removal handled in Toast component as well, but keep fallback
    setTimeout(() => {
      setToasts((t) => t.filter((i) => i.id !== id));
    }, 4500);
  }, []);

  const onDismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((i) => i.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={onDismiss} />
    </ToastContext.Provider>
  );
}
