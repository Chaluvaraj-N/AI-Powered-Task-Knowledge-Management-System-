import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import * as endpoints from "../api/endpoints";
import {
  Card,
  StatusBadge,
  Spinner,
  EmptyState,
  PrimaryButton,
} from "../components/ui";

export default function TasksPage() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assigned_to_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadTasks = useCallback(() => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (isAdmin && assignedFilter) params.assigned_to = assignedFilter;
    return endpoints
      .listTasks(params)
      .then(({ data }) => setTasks(data))
      .finally(() => setLoading(false));
  }, [statusFilter, assignedFilter, isAdmin]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (isAdmin) {
      endpoints.listUsers().then(({ data }) => setUsers(data));
    }
  }, [isAdmin]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.title.trim() || !form.assigned_to_id) {
      setFormError("Title and assignee are required.");
      return;
    }
    setSubmitting(true);
    try {
      await endpoints.createTask({
        title: form.title.trim(),
        description: form.description.trim(),
        assigned_to_id: Number(form.assigned_to_id),
      });
      setForm({ title: "", description: "", assigned_to_id: "" });
      setShowForm(false);
      await loadTasks();
    } catch (err) {
      setFormError(err?.response?.data?.detail || "Could not create task.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (task) => {
    const newStatus = task.status === "pending" ? "completed" : "pending";
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    try {
      await endpoints.updateTaskStatus(task.id, newStatus);
    } catch {
      loadTasks();
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
            Tasks
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink)]/55 sm:text-base">
            {isAdmin
              ? "Create tasks and assign them to your team."
              : "View your assigned tasks and mark them complete."}
          </p>
        </div>
        {isAdmin && (
          <PrimaryButton onClick={() => setShowForm((s) => !s)} className="sm:self-start">
            {showForm ? "Cancel" : "+ New Task"}
          </PrimaryButton>
        )}
      </div>

      {isAdmin && showForm && (
        <Card className="mb-6 p-5 sm:p-6">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink)]/60">
                  Title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="field"
                  placeholder="Review Q3 leave policy"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink)]/60">
                  Assign to
                </label>
                <select
                  value={form.assigned_to_id}
                  onChange={(e) => setForm({ ...form, assigned_to_id: e.target.value })}
                  className="field-select"
                >
                  <option value="">Select a user…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink)]/60">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="field min-h-[5.5rem] resize-y"
                placeholder="Optional details…"
              />
            </div>
            {formError && (
              <div className="text-sm text-[var(--color-danger)]">{formError}</div>
            )}
            <PrimaryButton type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? "Creating…" : "Create task"}
            </PrimaryButton>
          </form>
        </Card>
      )}

      {/* Dynamic filtering controls -> GET /tasks?status=&assigned_to= */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="field-select sm:w-52"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
        {isAdmin && (
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="field-select sm:w-56"
          >
            <option value="">All assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--color-ink)]/40 py-12 justify-center">
          <Spinner className="w-4 h-4" /> Loading tasks…
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState icon="☑" title="No tasks found" subtitle="Try adjusting the filters." />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                onClick={() => toggleStatus(task)}
                className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                  task.status === "completed"
                    ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-white"
                    : "border-[var(--color-line)] hover:border-[var(--color-accent)]"
                }`}
                title="Toggle status"
              >
                {task.status === "completed" && (
                  <span className="text-[10px] leading-none">✓</span>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-sm font-medium ${
                    task.status === "completed"
                      ? "line-through text-[var(--color-ink)]/40"
                      : "text-[var(--color-ink)]"
                  }`}
                >
                  {task.title}
                </div>
                {task.description && (
                  <div className="mt-0.5 break-words text-xs text-[var(--color-ink)]/50">
                    {task.description}
                  </div>
                )}
              </div>
              <div className="sm:self-start">
                <StatusBadge status={task.status} />
              </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
