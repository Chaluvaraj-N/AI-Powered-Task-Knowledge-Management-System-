export function Card({ children, className = "" }) {
  return (
    <div
      className={`surface ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusBadge({ status }) {
  const isCompleted = status === "completed";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium font-mono uppercase tracking-wide ${
        isCompleted
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-amber-50 text-amber-700 border border-amber-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isCompleted ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {status}
    </span>
  );
}

export function RoleBadge({ role }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wide ${
        isAdmin
          ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {role}
    </span>
  );
}

export function Spinner({ className = "" }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      role="status"
    />
  );
}

export function EmptyState({ icon = "○", title, subtitle }) {
  return (
    <div className="text-center py-10 sm:py-14 px-4">
      <div className="text-3xl mb-3 opacity-30" aria-hidden="true">
        {icon}
      </div>
      <div className="font-medium text-[var(--color-ink)]/70">{title}</div>
      {subtitle && (
        <div className="text-sm text-[var(--color-ink)]/40 mt-1 max-w-md mx-auto">
          {subtitle}
        </div>
      )}
    </div>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`btn-primary ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`btn-secondary ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export const fieldClass = "field";
export const selectClass = "field-select";
