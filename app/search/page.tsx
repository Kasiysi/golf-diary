"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEntries } from "@/lib/entries-context";
import { Search, Sparkles } from "lucide-react";

function searchEntries(entries: ReturnType<typeof useEntries>, q: string) {
  const term = q.trim().toLowerCase();
  if (!term) return entries;
  return entries.filter((e) => {
    const notes = (e.notes ?? "").toLowerCase();
    const problem = (e.problemNotes ?? "").toLowerCase();
    const cure = (e.cure ?? "").toLowerCase();
    const summary = (e.searchSummaryEnglish ?? "").toLowerCase();
    return [notes, problem, cure, summary].some((t) => t.includes(term));
  });
}

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const entries = useEntries();
  const filtered = useMemo(() => searchEntries(entries, q), [entries, q]);

  const [semanticMatches, setSemanticMatches] = useState<Array<{
    cureId: string;
    cureContent: string;
    cureContentEnglish: string | null;
    cureType: string;
    faultId?: string;
    faultDescription?: string;
    faultDescriptionEnglish?: string | null;
    similarity: number;
  }>>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticError, setSemanticError] = useState<string | null>(null);

  useEffect(() => {
    if (!q.trim()) {
      setSemanticMatches([]);
      setSemanticError(null);
      return;
    }
    setSemanticLoading(true);
    setSemanticError(null);
    fetch("/api/semantic-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q, limit: 10 }),
    })
      .then((res) => res.json())
      .then((data: { matches?: typeof semanticMatches; error?: string }) => {
        if (data.error) setSemanticError(data.error);
        else setSemanticMatches(Array.isArray(data.matches) ? data.matches : []);
      })
      .catch((e) => setSemanticError(e instanceof Error ? e.message : "Search failed"))
      .finally(() => setSemanticLoading(false));
  }, [q]);

  const hasSemantic = semanticMatches.length > 0;

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-white shadow-sm">
        <div className="flex h-14 items-center px-4 md:px-6">
          <h1 className="font-heading flex items-center gap-2 text-xl font-semibold text-[var(--heading)]">
            <Search className="h-5 w-5 text-[var(--accent)]" />
            Search
          </h1>
        </div>
      </header>
      <div className="p-4 md:p-6 space-y-4 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          {q
            ? `Problems, cures & coach advice matching "${q}"`
            : "Enter a search term in the sidebar (FI/EN). Semantic search when Supabase + Gemini are configured."}
        </p>

        {!q ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-muted)] p-8 text-center text-[var(--muted-foreground)]">
            Use the search bar in the sidebar to find entries by problem, cure, or coach advice text.
          </div>
        ) : (
          <>
            {semanticLoading && (
              <div className="rounded-xl border border-[var(--border)] bg-white shadow-[var(--shadow-sm)] p-4 text-center text-sm text-[var(--muted-foreground)]">
                Semantic search…
              </div>
            )}
            {!semanticLoading && semanticError && (
              <p className="text-xs text-[var(--muted-foreground)]">{semanticError}</p>
            )}
            {!semanticLoading && hasSemantic && (
              <section className="space-y-2">
                <h2 className="font-heading flex items-center gap-2 text-sm font-semibold text-[var(--heading)]">
                  <Sparkles className="h-4 w-4" />
                  Semantic matches
                </h2>
                <ul className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {semanticMatches.map((match, i) => (
                      <motion.li
                        key={match.cureId + String(i)}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl border border-[var(--border)] bg-white shadow-[var(--shadow)] overflow-hidden p-4"
                      >
                        {match.faultDescription != null && (
                          <div className="mb-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                              Problem
                            </span>
                            <p className="text-sm text-[var(--foreground)]">
                              {match.faultDescriptionEnglish ?? match.faultDescription}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                            Cure · {match.cureType}
                          </span>
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {match.cureContentEnglish ?? match.cureContent}
                          </p>
                        </div>
                        <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                          Similarity: {(match.similarity * 100).toFixed(0)}%
                        </p>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            )}

            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                In your diary
              </h2>
              {filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-muted)] p-8 text-center text-[var(--muted-foreground)]">
                  No diary entries match &quot;{q}&quot;.
                </div>
              ) : (
                <ul className="space-y-2">
                  {filtered.slice(0, 20).map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-xl border border-[var(--border)] bg-white shadow-[var(--shadow-sm)] p-3 text-sm text-[var(--foreground)]"
                    >
                      {entry.notes || entry.problemNotes || entry.cure || "—"}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Suspense fallback={<div className="p-6 text-[var(--muted-foreground)]">Loading…</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
