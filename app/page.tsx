"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEntries } from "@/lib/entries-context";
import { EntryCard } from "@/components/entry-card";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { QuickCheckDashboard } from "@/components/quick-check-dashboard";
import { CLUB_CATEGORIES } from "@/lib/constants";
import { BookOpen, Search, Crosshair, Target, Circle, MessageCircle } from "lucide-react";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "long-game": Crosshair,
  "short-game": Target,
  putting: Circle,
  "coach-advice": MessageCircle,
};

export default function DiaryPage() {
  const entries = useEntries();
  const router = useRouter();
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");

  const categoryFilter = (slug: string) =>
    entries.filter((e) => e.club === slug);
  const chronologicalEntries = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQ.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <motion.div
      className="min-h-screen bg-[var(--background)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#1a1a1c]/95 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4 md:px-6">
          <h1 className="flex items-center gap-2 text-lg font-semibold shrink-0">
            <BookOpen className="h-5 w-5 text-[var(--accent)]" />
            Diary
          </h1>
          <form onSubmit={handleSearch} className="flex-1 flex max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
              <input
                type="search"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search (FI/EN)…"
                className="w-full rounded-lg border border-white/20 bg-white/5 py-2 pl-8 pr-3 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                aria-label="Search"
              />
            </div>
          </form>
        </div>
      </header>

      <div className="p-4 md:p-6 space-y-6">
        {/* Quick-Check Dashboard — Top 3 Pinned Cures */}
        <QuickCheckDashboard />

        {/* High-contrast category buttons — easy to tap with gloves */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
            Categories
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {CLUB_CATEGORIES.map(({ value, label }) => {
              const Icon = categoryIcons[value];
              const count = categoryFilter(value).length;
              return (
                <Link
                  key={value}
                  href={`/club/${value}`}
                  className="flex items-center gap-3 rounded-2xl border-2 border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-3 text-[var(--foreground)] font-medium hover:bg-[var(--accent)]/20 hover:border-[var(--accent)] transition-colors min-h-[3.5rem]"
                >
                  {Icon && <Icon className="h-6 w-6 text-[var(--accent)] shrink-0" />}
                  <span className="truncate">{label}</span>
                  {count > 0 && (
                    <span className="ml-auto text-xs text-[var(--muted-foreground)] tabular-nums">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* Chronological feed — filtered by the four categories */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Chronological feed. Use the + button to add a new entry.
          </p>
          {chronologicalEntries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-dashed border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center text-[var(--muted-foreground)]"
            >
              No entries yet. Tap the + button to add your first note.
            </motion.div>
          ) : (
            <ul className="space-y-3 mt-3">
              <AnimatePresence mode="popLayout">
                {chronologicalEntries.map((entry, i) => (
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

        <VideoPlayerModal
          url={videoModalUrl}
          open={videoModalUrl !== null}
          onOpenChange={(open) => !open && setVideoModalUrl(null)}
        />
      </div>
    </motion.div>
  );
}
