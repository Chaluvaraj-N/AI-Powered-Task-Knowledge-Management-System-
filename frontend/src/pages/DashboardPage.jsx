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
    .then(({ data }) => {
      setAnalytics(data);
    })
    .catch((err) => {
      console.error("Analytics Error:", err);

      setAnalytics({
        total_tasks: 0,
        completed_tasks: 0,
        pending_tasks: 0,
        total_documents: 0,
        total_users: 0,
        total_searches: 0,
        most_searched_queries: [],
      });
    })
    .finally(() => {
      setLoading(false);
    });
}, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
          {greeting}, {user?.full_name?.split(" ")[0]}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink)]/55 sm:text-base">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
            <StatCard label="Total Tasks" value={analytics.total_tasks} />
            <StatCard label="Completed" value={analytics.completed_tasks} accent />
            <StatCard label="Pending" value={analytics.pending_tasks} />
            <StatCard label="Documents" value={analytics.total_documents} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold mb-4 sm:text-xl">
                Task Completion
              </h2>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-6">
                <div>
                  <div className="text-4xl font-display font-semibold text-[var(--color-accent)] sm:text-5xl">
                    {analytics.total_tasks > 0
                      ? Math.round(
                          (analytics.completed_tasks / analytics.total_tasks) * 100
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-xs text-[var(--color-ink)]/40 mt-1">completion rate</div>
                </div>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--color-paper)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)] transition-all"
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
                className="mt-5 inline-flex text-sm font-medium text-[var(--color-accent)] hover:underline"
              >
                View all tasks →
              </button>
            </Card>

            <Card className="p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold mb-4 sm:text-xl">
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
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 flex-1 break-words text-[var(--color-ink)]/80">
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
                  className="mt-5 inline-flex text-sm font-medium text-[var(--color-accent)] hover:underline"
              >
                Search knowledge base →
              </button>
            </Card>
          </div>

          {isAdmin && (
              <div className="grid gap-4 mt-6 sm:grid-cols-2">
              <StatCard label="Total Users" value={analytics.total_users} />
              <StatCard label="Total Searches Run" value={analytics.total_searches} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
