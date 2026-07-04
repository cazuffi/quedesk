import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface ConfirmRequest {
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (confirmed: boolean) => void;
}

interface ConfirmContextValue {
  confirm: (
    message: string,
    options?: { confirmLabel?: string; danger?: boolean },
  ) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const confirm = useCallback(
    (
      message: string,
      options?: { confirmLabel?: string; danger?: boolean },
    ) =>
      new Promise<boolean>((resolve) => {
        setRequest({
          message,
          confirmLabel: options?.confirmLabel,
          danger: options?.danger,
          resolve,
        });
      }),
    [],
  );

  const close = useCallback((confirmed: boolean) => {
    setRequest((current) => {
      current?.resolve(confirmed);
      return null;
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {request && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => close(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <h3
              id="confirm-title"
              className="text-sm font-semibold tracking-tight text-[var(--color-text)]"
            >
              Confirm
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {request.message}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-xl bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className={[
                  "rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md",
                  request.danger
                    ? "bg-[var(--color-danger)] hover:bg-red-600"
                    : "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]",
                ].join(" ")}
              >
                {request.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return context;
}
