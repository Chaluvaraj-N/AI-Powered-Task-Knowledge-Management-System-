import { useEffect, useRef, useState } from "react";
import * as endpoints from "../api/endpoints";
import { Card, Spinner, EmptyState, PrimaryButton, SecondaryButton } from "../components/ui";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const loadDocuments = () => {
    setLoading(true);
    return endpoints
      .listDocuments()
      .then(({ data }) => setDocuments(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["txt", "pdf"].includes(ext)) {
      setError("Only .txt and .pdf files are supported.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      await endpoints.uploadDocument(file);
      await loadDocuments();
    } catch (err) {
      setError(err?.response?.data?.detail || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    try {
      await endpoints.deleteDocument(id);
    } catch {
      loadDocuments();
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-3xl">
          Documents
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-ink)]/55 sm:text-base">
          Upload .txt or .pdf files. Each upload is chunked and embedded into the
          local semantic search index automatically.
        </p>
      </div>

      <Card
        className={`mb-8 border-2 border-dashed p-5 text-center transition-colors sm:p-8 ${
          dragOver
            ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]"
            : "border-[var(--color-line)]"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleUpload(e.dataTransfer.files?.[0]);
        }}
      >
        <div className="mb-2 text-2xl opacity-40" aria-hidden="true">
          ⎘
        </div>
        <p className="mb-4 text-sm text-[var(--color-ink)]/60">
          Drag &amp; drop a .txt or .pdf file here, or
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.pdf"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />
        <PrimaryButton
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full sm:w-auto"
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              <Spinner className="w-4 h-4" /> Uploading &amp; indexing…
            </span>
          ) : (
            "Choose file"
          )}
        </PrimaryButton>
        {error && <p className="text-sm text-[var(--color-danger)] mt-3">{error}</p>}
      </Card>

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--color-ink)]/40 py-12 justify-center">
          <Spinner className="w-4 h-4" /> Loading documents…
        </div>
      ) : documents.length === 0 ? (
        <EmptyState icon="⎘" title="No documents yet" subtitle="Upload your first knowledge base file above." />
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-light)] text-xs font-mono uppercase text-[var(--color-accent)]">
                {doc.file_type}
              </div>
              <div className="flex-1 min-w-0">
                <div className="break-words text-sm font-medium text-[var(--color-ink)]">
                  {doc.title}
                </div>
                <div className="text-xs text-[var(--color-ink)]/40 mt-0.5">
                  Uploaded {new Date(doc.uploaded_at).toLocaleString()}
                </div>
              </div>
              <span
                className={`text-xs font-mono px-2 py-1 rounded-full shrink-0 ${
                  doc.indexed
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {doc.indexed ? "indexed" : "pending"}
              </span>
              <SecondaryButton
                onClick={() => handleDelete(doc.id)}
                className="w-full shrink-0 text-[var(--color-danger)] sm:w-auto"
              >
                Delete
              </SecondaryButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
