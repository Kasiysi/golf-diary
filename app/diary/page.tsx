"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEntries } from "@/lib/entries-context";
import { EntryCard } from "@/components/entry-card";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { CLUB_CATEGORIES } from "@/lib/constants";
import { BookOpen, Crosshair, Target, Circle, MessageCircle } from "lucide-react";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "long-game": Crosshair,
  "short-game": Target,
  putting: Circle,
  "coach-advice": MessageCircle,
};

export default function DiaryPage() {
  const entries = useEntries();
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);

  const categoryFilter = (slug: string) =>
    entries.filter((e) => e.club === slug);
  const chronologicalEntries = [...entries].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <motion.div
      className="min-h-screen bg-[var(--background)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-white shadow-sm">
        <div className="flex h-14 items-center gap-3 px-4 md:px-6">
          <h1 className="font-heading flex items-center gap-2 text-xl font-semibold shrink-0 text-[var(--heading)]">
            <BookOpen className="h-5 w-5 text-[var(--accent)]" />
            Diary
          </h1>
        </div>
      </header>

      <div className="p-4 md:p-6 space-y-6">
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
                  className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--foreground)] font-medium shadow-[var(--shadow-sm)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5 transition-all min-h-[3.5rem]"
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

        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Chronological feed. Use the + button to add a new entry.
          </p>
          {chronologicalEntries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-muted)] p-8 text-center text-[var(--muted-foreground)]"
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
