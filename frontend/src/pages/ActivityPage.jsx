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
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
          Activity Log
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink)]/55 sm:text-base">
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
        <Card className="divide-y divide-[var(--color-line)] overflow-hidden">
          {logs.map((log) => (
            <div key={log.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:gap-4 sm:px-5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-xs text-[var(--color-accent)]">
                {ACTION_ICONS[log.action] || "•"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="break-words text-sm text-[var(--color-ink)]">
                  <span className="mr-2 font-mono text-xs uppercase tracking-wide text-[var(--color-ink)]/50">
                    {log.action.replace("_", " ")}
                  </span>
                  {log.details}
                </div>
              </div>
              <div className="shrink-0 font-mono text-xs text-[var(--color-ink)]/40 sm:whitespace-nowrap">
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
