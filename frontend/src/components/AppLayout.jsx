import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkBase =
  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors";

function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `${linkBase} ${
          isActive
            ? "bg-[var(--color-accent)] text-white"
            : "text-[var(--color-ink)]/70 hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)]"
        }`
      }
    >
      <span className="text-base leading-none">{icon}</span>
      {label}
    </NavLink>
  );
}

export default function AppLayout({ children }) {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-paper)]">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-[var(--color-line)] bg-[var(--color-panel)] flex flex-col">
        <div className="px-6 py-6 border-b border-[var(--color-line)]">
          <div className="font-display text-xl font-semibold tracking-tight text-[var(--color-ink)]">
            Knowledge<span className="text-[var(--color-accent)]">&amp;</span>Tasks
          </div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink)]/40 mt-1">
            AI Knowledge Base
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          <NavItem to="/" label="Dashboard" icon="◆" />
          <NavItem to="/search" label="Search Knowledge" icon="⌕" />
          <NavItem to="/tasks" label="Tasks" icon="☑" />
          {isAdmin && <NavItem to="/documents" label="Documents" icon="⎘" />}
          {isAdmin && <NavItem to="/activity" label="Activity Log" icon="≡" />}
        </nav>

        <div className="px-4 py-4 border-t border-[var(--color-line)]">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {user?.full_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user?.full_name}</div>
              <div className="text-[11px] font-mono uppercase text-[var(--color-ink)]/40">
                {user?.role}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full text-left px-2 py-2 rounded-lg text-sm text-[var(--color-danger)] hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
