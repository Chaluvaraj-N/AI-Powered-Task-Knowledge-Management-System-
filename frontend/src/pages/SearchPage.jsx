import { useState } from "react";
import * as endpoints from "../api/endpoints";
import { Card, Spinner, EmptyState, PrimaryButton } from "../components/ui";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchedFor, setSearchedFor] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await endpoints.semanticSearch(query.trim());
      setResults(data.results);
      setSearchedFor(query.trim());
    } catch (err) {
      setError(err?.response?.data?.detail || "Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const scorePercent = (score) => Math.round(Math.max(0, Math.min(1, score)) * 100);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
          Search Knowledge Base
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink)]/55 sm:text-base">
          Ask a question in plain language — this runs against a locally-built
          embedding index (TF-IDF + SVD → FAISS), not an external LLM.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-ink)]/30" aria-hidden="true">
            ⌕
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. how many days of annual leave do I get?"
            className="field pl-10"
          />
        </div>
        <PrimaryButton type="submit" disabled={loading} className="w-full sm:w-auto sm:px-6">
          {loading ? <Spinner className="w-4 h-4" /> : "Search"}
        </PrimaryButton>
      </form>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {results === null && !loading && (
        <EmptyState
          icon="⌕"
          title="Search the knowledge base"
          subtitle="Results are ranked by semantic similarity, not just keyword match."
        />
      )}

      {results !== null && results.length === 0 && (
        <EmptyState
          icon="∅"
          title={`No results for "${searchedFor}"`}
          subtitle="Try rephrasing, or ask an admin to upload relevant documents."
        />
      )}

      {results && results.length > 0 && (
        <div className="space-y-4">
          <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-ink)]/40">
            {results.length} result{results.length !== 1 ? "s" : ""} for "{searchedFor}"
          </div>
          {results.map((r, i) => (
            <Card key={i} className="p-5">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-[var(--color-accent)]" aria-hidden="true">
                    ⎘
                  </span>
                  <span className="break-words text-sm font-medium text-[var(--color-ink)]">
                    {r.document_title}
                  </span>
                </div>
                <div className="flex items-center gap-2 self-start shrink-0">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--color-paper)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)]"
                      style={{ width: `${scorePercent(r.score)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-[var(--color-ink)]/40">
                    {scorePercent(r.score)}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-[var(--color-ink)]/70 leading-relaxed">
                {r.chunk_text}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
