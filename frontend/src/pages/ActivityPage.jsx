import { useEffect, useState } from "react";
import * as endpoints from "../api/endpoints";
import { Card, Spinner, EmptyState } from "../components/ui";

const ACTION_ICONS = {
  login: "→",
  task_update: "☑",
  task_create: "＋",
  task_delete: "－",
  document_upload: "⎘",
  document_delete: "－",
  search: "⌕",
};

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    endpoints
      .getActivityLogs()
      .then(({ data }) => setLogs(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
          Activity Log
        </h1>
        <p className="text-sm text-[var(--color-ink)]/50 mt-1">
          Recent logins, searches, uploads, and task changes across the system.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--color-ink)]/40 py-12 justify-center">
          <Spinner className="w-4 h-4" /> Loading activity…
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon="≡" title="No activity yet" />
      ) : (
        <Card className="divide-y divide-[var(--color-line)]">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-4 px-5 py-3.5">
              <div className="w-7 h-7 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center text-xs shrink-0 mt-0.5">
                {ACTION_ICONS[log.action] || "•"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[var(--color-ink)]">
                  <span className="font-mono text-xs uppercase tracking-wide text-[var(--color-ink)]/50 mr-2">
                    {log.action.replace("_", " ")}
                  </span>
                  {log.details}
                </div>
              </div>
              <div className="text-xs text-[var(--color-ink)]/40 font-mono shrink-0 whitespace-nowrap">
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
