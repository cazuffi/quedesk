import { useEffect, useState, type ReactNode } from "react";
import { getSupabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-surface)]">
        <div className="text-[var(--color-text-muted)]">Loading...</div>
      </div>
    );
  }

  if (session) {
    return <div className="app-shell h-full min-h-0">{children}</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const sb = getSupabase();

    try {
      if (mode === "signup") {
        const { error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--color-surface)] p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
            <span className="bg-gradient-to-br from-[var(--color-accent)] to-indigo-400 bg-clip-text text-transparent">
              Q
            </span>
            ueDesk
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {mode === "login" ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-soft)]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-[var(--color-danger-soft)] px-3 py-2 text-xs text-[var(--color-danger)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            {loading ? "..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError(null);
            }}
            className="font-medium text-[var(--color-accent)] hover:underline"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
