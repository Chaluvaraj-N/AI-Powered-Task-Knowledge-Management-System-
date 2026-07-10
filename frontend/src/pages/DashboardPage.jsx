import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as endpoints from "../api/endpoints";
import { Card, Spinner } from "../components/ui";

function StatCard({ label, value, accent }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-mono uppercase tracking-wider text-[var(--color-ink)]/40">
        {label}
      </div>
      <div
        className={`font-display text-3xl font-semibold mt-2 ${
          accent ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"
        }`}
      >
        {value}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    endpoints
      .getAnalytics()
      .then(({ data }) => setAnalytics(data))
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
          {greeting}, {user?.full_name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-[var(--color-ink)]/50 mt-1">
          {isAdmin
            ? "Here's what's happening across the knowledge base and task board."
            : "Here's a quick look at your tasks and the shared knowledge base."}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--color-ink)]/40 py-12 justify-center">
          <Spinner className="w-4 h-4" /> Loading analytics…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Tasks" value={analytics.total_tasks} />
            <StatCard label="Completed" value={analytics.completed_tasks} accent />
            <StatCard label="Pending" value={analytics.pending_tasks} />
            <StatCard label="Documents" value={analytics.total_documents} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold mb-4">Task Completion</h2>
              <div className="flex items-end gap-6">
                <div>
                  <div className="text-4xl font-display font-semibold text-[var(--color-accent)]">
                    {analytics.total_tasks > 0
                      ? Math.round(
                          (analytics.completed_tasks / analytics.total_tasks) * 100
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-xs text-[var(--color-ink)]/40 mt-1">completion rate</div>
                </div>
                <div className="flex-1 h-3 bg-[var(--color-paper)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-accent)] rounded-full transition-all"
                    style={{
                      width: `${
                        analytics.total_tasks > 0
                          ? (analytics.completed_tasks / analytics.total_tasks) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => navigate("/tasks")}
                className="mt-5 text-sm font-medium text-[var(--color-accent)] hover:underline"
              >
                View all tasks →
              </button>
            </Card>

            <Card className="p-6">
              <h2 className="font-display text-lg font-semibold mb-4">
                Most Searched Queries
              </h2>
              {analytics.most_searched_queries.length === 0 ? (
                <p className="text-sm text-[var(--color-ink)]/40">
                  No searches yet — try the AI knowledge search.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {analytics.most_searched_queries.slice(0, 6).map((q, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-sm gap-3"
                    >
                      <span className="truncate text-[var(--color-ink)]/80">
                        "{q.query_text}"
                      </span>
                      <span className="font-mono text-xs text-[var(--color-ink)]/40 shrink-0">
                        ×{q.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={() => navigate("/search")}
                className="mt-5 text-sm font-medium text-[var(--color-accent)] hover:underline"
              >
                Search knowledge base →
              </button>
            </Card>
          </div>

          {isAdmin && (
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <StatCard label="Total Users" value={analytics.total_users} />
              <StatCard label="Total Searches Run" value={analytics.total_searches} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
