"use client";

import { useSearchParams } from "next/navigation";
import { useState, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEntries } from "@/lib/entries-context";
import { EntryCard } from "@/components/entry-card";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { Search } from "lucide-react";

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
  const filtered = useMemo(() => searchEntries(entries, q), [entries, q]);

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
          {q ? `Problems, cures & coach advice matching “${q}”` : "Enter a search term in the sidebar."}
        </p>
        {!q ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center text-[var(--muted-foreground)]">
            Use the search bar in the sidebar to find entries by problem, cure, or coach advice text.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center text-[var(--muted-foreground)]">
            No entries match “{q}”.
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
