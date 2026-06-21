"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ToastKind = "info" | "success" | "error";
interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
}

interface ToastApi {
  toast: (t: { kind?: ToastKind; title: string; detail?: string }) => void;
}

const ToastCtx = createContext<ToastApi>({ toast: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

let seq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: { kind?: ToastKind; title: string; detail?: string }) => {
    const id = ++seq;
    setToasts((prev) => [...prev, { id, kind: t.kind ?? "info", title: t.title, detail: t.detail }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="mo-toast-wrap" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`mo-toast mo-toast-${t.kind}`}>
            <span className="mo-toast-dot" />
            <div className="mo-toast-body">
              <div className="mo-toast-title">{t.title}</div>
              {t.detail && <div className="mo-toast-detail">{t.detail}</div>}
            </div>
            <button className="mo-toast-x" onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} aria-label="Dismiss">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/** Optional: a tiny event bridge so non-React code can fire toasts. */
export function useToastBridge() {
  const { toast } = useToast();
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as { kind?: ToastKind; title: string; detail?: string };
      if (d?.title) toast(d);
    };
    window.addEventListener("devroom:toast", handler);
    return () => window.removeEventListener("devroom:toast", handler);
  }, [toast]);
}
