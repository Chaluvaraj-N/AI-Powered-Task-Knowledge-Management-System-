import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkBase =
  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors";

const navItems = [
  { to: "/", label: "Dashboard", icon: "◆" },
  { to: "/search", label: "Search Knowledge", icon: "⌕" },
  { to: "/tasks", label: "Tasks", icon: "☑" },
  { to: "/documents", label: "Documents", icon: "⎘", adminOnly: true },
  { to: "/activity", label: "Activity Log", icon: "≡", adminOnly: true },
];

function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `${linkBase} ${
          isActive
            ? "bg-[var(--color-accent)] text-white shadow-sm"
            : "text-[var(--color-ink)]/70 hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)]"
        }`
      }
    >
      <span className="text-base leading-none" aria-hidden="true">
        {icon}
      </span>
      {label}
    </NavLink>
  );
}

export default function AppLayout({ children }) {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    signOut();
    navigate("/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-[var(--color-paper)] lg:flex">
      <button
        type="button"
        className={`fixed inset-0 z-30 bg-black/30 transition-opacity lg:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeSidebar}
        aria-label="Close navigation"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col border-r border-[var(--color-line)] bg-[var(--color-panel)] shadow-xl transition-transform duration-200 ease-out lg:static lg:z-auto lg:shadow-none lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-line)] px-5 py-5 sm:px-6">
          <div>
            <div className="font-display text-xl font-semibold tracking-tight text-[var(--color-ink)]">
              AI-Powered Task &amp; Knowledge Management System
            </div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink)]/40">
              Task orchestration and semantic search platform
            </div>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="rounded-full px-3 py-2 text-sm text-[var(--color-ink)]/50 hover:bg-[var(--color-accent-light)] lg:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 sm:px-4">
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <NavItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
            ))}
        </nav>

        <div className="border-t border-[var(--color-line)] p-4 sm:p-5">
          <div className="flex items-center gap-3 rounded-xl bg-[var(--color-paper)] px-3 py-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-semibold text-white">
              {user?.full_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-[var(--color-ink)]">
                {user?.full_name}
              </div>
              <div className="font-mono text-[11px] uppercase text-[var(--color-ink)]/40">
                {user?.role}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary mt-3 w-full justify-start text-[var(--color-danger)] hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-hidden lg:overflow-y-auto">
        <div className="sticky top-0 z-20 border-b border-[var(--color-line)] bg-[var(--color-paper)]/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="btn-secondary px-3 py-2 text-base"
              aria-label="Open navigation"
            >
              ☰
            </button>
            <div className="min-w-0 text-center">
              <div className="truncate font-display text-lg font-semibold tracking-tight">
                AI-Powered Task &amp; Knowledge Management System
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-ink)]/40">
                Task orchestration and semantic search platform
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary px-3 py-2 text-xs text-[var(--color-danger)]"
            >
              Out
            </button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
