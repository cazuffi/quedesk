import { useCallback, useEffect, useState } from "react";
import {
  createCaptureToken,
  describeError,
  getCaptureEndpointUrl,
  listCaptureTokens,
  revokeCaptureToken,
  testCaptureToken,
  type CaptureTokenRecord,
} from "../lib/captureTokens";

interface CaptureSettingsPanelProps {
  onClose: () => void;
}

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CaptureSettingsPanel({ onClose }: CaptureSettingsPanelProps) {
  const [tokens, setTokens] = useState<CaptureTokenRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState<"token" | "url" | null>(null);

  const endpointUrl = getCaptureEndpointUrl();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTokens(await listCaptureTokens());
    } catch (e) {
      setError(describeError(e, "Could not load tokens"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const token = await createCaptureToken("Action Button");
      setNewToken(token);
      await refresh();
    } catch (e) {
      setError(describeError(e, "Could not create token"));
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(id: string) {
    setBusy(true);
    setError(null);
    try {
      await revokeCaptureToken(id);
      await refresh();
    } catch (e) {
      setError(describeError(e, "Could not revoke token"));
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    if (!newToken) return;
    setBusy(true);
    setError(null);
    try {
      await testCaptureToken(newToken, "Test capture from QueDesk");
      await refresh();
    } catch (e) {
      setError(describeError(e, "Test failed"));
    } finally {
      setBusy(false);
    }
  }

  async function copyText(text: string, kind: "token" | "url") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Could not copy to clipboard");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="capture-settings-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3">
          <div>
            <h2
              id="capture-settings-title"
              className="text-sm font-semibold tracking-tight"
            >
              Quick capture
            </h2>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Headless Inbox capture for Shortcuts & Action Button
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2.5 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)]"
          >
            Done
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {error && (
            <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-xs text-[var(--color-danger)]">
              {error}
            </p>
          )}

          {newToken && (
            <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] p-3">
              <p className="text-xs font-semibold text-[var(--color-accent)]">
                Copy this token now — it won&apos;t be shown again
              </p>
              <code className="mt-2 block break-all rounded-lg bg-[var(--color-surface-raised)] px-3 py-2 text-[11px]">
                {newToken}
              </code>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyText(newToken, "token")}
                  className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white"
                >
                  {copied === "token" ? "Copied!" : "Copy token"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleTest()}
                  className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                >
                  Send test to Inbox
                </button>
                <button
                  type="button"
                  onClick={() => setNewToken(null)}
                  className="rounded-lg px-3 py-1.5 text-xs text-[var(--color-text-muted)]"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Active tokens
            </h3>
            {loading ? (
              <p className="text-xs text-[var(--color-text-muted)]">Loading…</p>
            ) : tokens.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                No tokens yet. Generate one for your iPhone Shortcut.
              </p>
            ) : (
              <ul className="space-y-2">
                {tokens.map((token) => (
                  <li
                    key={token.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{token.label}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        …{token.tokenPrefix} · Last used{" "}
                        {formatWhen(token.lastUsedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleRevoke(token.id)}
                      className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-soft)] disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleCreate()}
              className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              Generate new token
            </button>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Capture endpoint
            </h3>
            <code className="block break-all rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[11px]">
              {endpointUrl}
            </code>
            <button
              type="button"
              onClick={() => copyText(endpointUrl, "url")}
              className="text-xs font-medium text-[var(--color-accent)]"
            >
              {copied === "url" ? "URL copied!" : "Copy endpoint URL"}
            </button>
          </section>

          <section className="space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
            <h3 className="font-semibold text-[var(--color-text)]">
              iPhone Action Button setup
            </h3>
            <ol className="list-decimal space-y-1.5 pl-4">
              <li>Generate a token above and copy it.</li>
              <li>
                Open the <strong className="text-[var(--color-text)]">Shortcuts</strong>{" "}
                app → New Shortcut.
              </li>
              <li>Add <strong className="text-[var(--color-text)]">Ask for Input</strong>{" "}
                (Text) — enable dictation if you like.</li>
              <li>
                Add <strong className="text-[var(--color-text)]">Get Contents of URL</strong>:
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  <li>URL: the capture endpoint above</li>
                  <li>Method: POST</li>
                  <li>
                    Headers:{" "}
                    <code className="text-[10px]">Authorization: Bearer YOUR_TOKEN</code>
                  </li>
                  <li>
                    Request Body: JSON —{" "}
                    <code className="text-[10px]">{`{"title": "Shortcut Input"}`}</code>
                  </li>
                </ul>
              </li>
              <li>
                Add <strong className="text-[var(--color-text)]">Show Notification</strong>{" "}
                — “Added to Inbox ✓”
              </li>
              <li>
                Settings → Action Button → Shortcut → pick this shortcut.
              </li>
            </ol>
          </section>
        </div>

        <div className="border-t border-[var(--color-border)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-[10px] text-[var(--color-text-muted)]">
            Treat your token like a password. Revoke it if your Shortcut is shared or
            leaked.
          </p>
        </div>
      </div>
    </div>
  );
}
