import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PrimaryButton, fieldClass } from "../components/ui";

export default function LoginPage() {
  const { signIn, signUp, loading, error } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("admin@company.com");
  const [password, setPassword] = useState("Admin@123");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok =
      mode === "login"
        ? await signIn(email, password)
        : await signUp(fullName, email, password);
    if (ok) navigate("/");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(42,92,83,0.08),_transparent_36%),linear-gradient(180deg,_#f7f5f0_0%,_#f4f0e8_100%)] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="surface hidden flex-col justify-between p-8 lg:flex xl:p-10">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-ink)]/40">
                Secure workspace
              </div>
              <h1 className="mt-4 max-w-md font-display text-4xl font-semibold tracking-tight text-[var(--color-ink)] xl:text-5xl">
                Knowledge and task operations in one responsive workspace.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--color-ink)]/65 sm:text-base">
                Sign in to search documents, manage tasks, and monitor activity with a
                clean interface that adapts from mobile to large desktop screens.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[var(--color-paper)] p-4">
                <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink)]/40">
                  Fast access
                </div>
                <div className="mt-2 text-sm text-[var(--color-ink)]/70">
                  One place for search, tasks, and document management.
                </div>
              </div>
              <div className="rounded-2xl bg-[var(--color-paper)] p-4">
                <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink)]/40">
                  Responsive by default
                </div>
                <div className="mt-2 text-sm text-[var(--color-ink)]/70">
                  Layouts adapt cleanly to phones, tablets, laptops, and widescreens.
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <div className="mb-8 text-center lg:text-left">
              <div className="font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
                AI-Powered Task &amp; Knowledge Management System
              </div>
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink)]/45 sm:text-sm lg:max-w-md">
                Task orchestration and semantic search platform
              </p>
            </div>

            <div className="surface p-5 sm:p-6 lg:p-8">
              <div className="mb-6 flex rounded-xl bg-[var(--color-paper)] p-1">
                <button
                  type="button"
                  className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    mode === "login"
                      ? "bg-white shadow-sm text-[var(--color-ink)]"
                      : "text-[var(--color-ink)]/50"
                  }`}
                  onClick={() => setMode("login")}
                  aria-pressed={mode === "login"}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    mode === "register"
                      ? "bg-white shadow-sm text-[var(--color-ink)]"
                      : "text-[var(--color-ink)]/50"
                  }`}
                  onClick={() => setMode("register")}
                  aria-pressed={mode === "register"}
                >
                  Create account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink)]/60">
                      Full name
                    </label>
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={fieldClass}
                      placeholder="Jane Doe"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink)]/60">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink)]/60">
                    Password
                  </label>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={fieldClass}
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
                    {error}
                  </div>
                )}

                <PrimaryButton type="submit" disabled={loading} className="w-full">
                  {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
                </PrimaryButton>
              </form>

              <div className="mt-6 text-center text-xs font-mono text-[var(--color-ink)]/40 sm:text-sm">
                Demo admin: admin@company.com / Admin@123 · Demo user: user@company.com / User@123
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
