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
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)]">
          Search Knowledge Base
        </h1>
        <p className="text-sm text-[var(--color-ink)]/50 mt-1">
          Ask a question in plain language — this runs against a locally-built
          embedding index (TF-IDF + SVD → FAISS), not an external LLM.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-ink)]/30">
            ⌕
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. how many days of annual leave do I get?"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[var(--color-line)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
          />
        </div>
        <PrimaryButton type="submit" disabled={loading} className="px-6">
          {loading ? <Spinner className="w-4 h-4" /> : "Search"}
        </PrimaryButton>
      </form>

      {error && (
        <div className="text-sm text-[var(--color-danger)] bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
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
          <div className="text-xs font-mono uppercase tracking-wider text-[var(--color-ink)]/40">
            {results.length} result{results.length !== 1 ? "s" : ""} for "{searchedFor}"
          </div>
          {results.map((r, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-accent)]">⎘</span>
                  <span className="font-medium text-sm text-[var(--color-ink)]">
                    {r.document_title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-16 h-1.5 rounded-full bg-[var(--color-paper)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-accent)] rounded-full"
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
