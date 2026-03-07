"use client";

import { useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEntries } from "@/lib/entries-context";
import { EntryCard } from "@/components/entry-card";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { Search, Sparkles } from "lucide-react";

interface SemanticMatch {
  cureId: string;
  cureContent: string;
  cureContentEnglish: string | null;
  cureType: string;
  faultId?: string;
  faultDescription?: string;
  faultDescriptionEnglish?: string | null;
  similarity: number;
}

function searchEntries(entries: ReturnType<typeof useEntries>, q: string) {
  const term = q.trim().toLowerCase();
  if (!term) return entries;
  return entries.filter((e) => {
    const problem = (e.problemNotes ?? "").toLowerCase();
    const cure = (e.cure ?? "").toLowerCase();
    const coachNotes = e.entryType === "coach-advice" ? (e.notes ?? "").toLowerCase() : "";
    return problem.includes(term) || cure.includes(term) || coachNotes.includes(term);
  });
}

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const entries = useEntries();
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [semanticMatches, setSemanticMatches] = useState<SemanticMatch[]>([]);
  const [semanticSource, setSemanticSource] = useState<"linked" | "direct" | "none">("none");
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticError, setSemanticError] = useState<string | null>(null);

  const filtered = useMemo(() => searchEntries(entries, q), [entries, q]);

  useEffect(() => {
    if (!q.trim()) {
      setSemanticMatches([]);
      setSemanticSource("none");
      setSemanticError(null);
      return;
    }
    let cancelled = false;
    setSemanticLoading(true);
    setSemanticError(null);
    fetch("/api/semantic-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: q.trim(), limit: 10 }),
    })
      .then((res) => res.json())
      .then((data: { matches?: SemanticMatch[]; source?: "linked" | "direct" | "none"; error?: string }) => {
        if (cancelled) return;
        setSemanticMatches(Array.isArray(data.matches) ? data.matches : []);
        setSemanticSource(data.source ?? "none");
        setSemanticError(data.error ?? null);
      })
      .catch((e) => {
        if (!cancelled) {
          setSemanticMatches([]);
          setSemanticSource("none");
          setSemanticError(e instanceof Error ? e.message : "Search failed");
        }
      })
      .finally(() => {
        if (!cancelled) setSemanticLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  const hasSemantic = semanticMatches.length > 0;

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#1a1a1c]/90 backdrop-blur-xl">
        <div className="flex h-14 items-center px-4 md:px-6">
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <Search className="h-5 w-5 text-[var(--accent)]" />
            Search
          </h1>
        </div>
      </header>
      <div className="p-4 md:p-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          {q
            ? `Problems, cures & coach advice matching "${q}"`
            : "Enter a search term in the sidebar (FI/EN). Semantic search when Supabase is connected."}
        </p>

        {!q ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center text-[var(--muted-foreground)]">
            Use the search bar in the sidebar to find entries by problem, cure, or coach advice text.
          </div>
        ) : (
          <>
            {/* Semantic results (linked cures / direct cures) */}
            {semanticLoading && (
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-center text-sm text-[var(--muted-foreground)]">
                Semantic search…
              </div>
            )}
            {!semanticLoading && semanticError && (
              <p className="text-xs text-[var(--muted-foreground)]">{semanticError}</p>
            )}
            {!semanticLoading && hasSemantic && (
              <section className="space-y-2">
                <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                  <Sparkles className="h-4 w-4" />
                  Semantic matches
                  {semanticSource === "linked" && " (fault → cure)"}
                </h2>
                <ul className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {semanticMatches.map((match, i) => (
                      <motion.li
                        key={match.cureId}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
                      >
                        <div className="p-4 space-y-2">
                          {match.faultDescription != null && (
                            <div>
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
                          <p className="text-[10px] text-[var(--muted-foreground)]">
                            Similarity: {(match.similarity * 100).toFixed(0)}%
                          </p>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            )}

            {/* Diary entries (text match fallback) */}
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                In your diary
              </h2>
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center text-[var(--muted-foreground)]">
                  No diary entries match &quot;{q}&quot;.
                </div>
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filtered.map((entry, i) => (
                      <motion.li
                        key={entry.id}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                      >
                        <EntryCard
                          entry={entry}
                          onVideoClick={(url) => setVideoModalUrl(url)}
                        />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </section>
          </>
        )}

        <VideoPlayerModal
          url={videoModalUrl}
          open={videoModalUrl !== null}
          onOpenChange={(open) => !open && setVideoModalUrl(null)}
        />
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="p-6 text-[var(--muted-foreground)]">Loading…</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
