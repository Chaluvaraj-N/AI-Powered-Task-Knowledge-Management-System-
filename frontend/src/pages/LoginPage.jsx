import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PrimaryButton } from "../components/ui";

export default function LoginPage() {
  const { signIn, signUp, loading, error } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // login | register
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
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-paper)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-display text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
            Knowledge<span className="text-[var(--color-accent)]">&amp;</span>Tasks
          </div>
          <p className="text-sm text-[var(--color-ink)]/50 mt-2 font-mono uppercase tracking-wider">
            AI-powered task &amp; knowledge management
          </p>
        </div>

        <div className="bg-[var(--color-panel)] border border-[var(--color-line)] rounded-2xl p-8 shadow-sm">
          <div className="flex mb-6 rounded-lg bg-[var(--color-paper)] p-1">
            <button
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "login"
                  ? "bg-white shadow-sm text-[var(--color-ink)]"
                  : "text-[var(--color-ink)]/50"
              }`}
              onClick={() => setMode("login")}
              type="button"
            >
              Sign in
            </button>
            <button
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === "register"
                  ? "bg-white shadow-sm text-[var(--color-ink)]"
                  : "text-[var(--color-ink)]/50"
              }`}
              onClick={() => setMode("register")}
              type="button"
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium text-[var(--color-ink)]/60 mb-1.5">
                  Full name
                </label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-line)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
                  placeholder="Jane Doe"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink)]/60 mb-1.5">
                Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-line)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink)]/60 mb-1.5">
                Password
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-line)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-[var(--color-danger)] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <PrimaryButton type="submit" disabled={loading} className="w-full py-2.5">
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </PrimaryButton>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-[var(--color-ink)]/40 font-mono">
          Demo admin: admin@company.com / Admin@123 · Demo user: user@company.com / User@123
        </div>
      </div>
    </div>
  );
}
