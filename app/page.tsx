"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEntries } from "@/lib/entries-context";
import { EntryCard } from "@/components/entry-card";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { FundamentalsChecklist } from "@/components/fundamentals-checklist";
import { BookOpen } from "lucide-react";

export default function DiaryPage() {
  const entries = useEntries();
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);

  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#1a1a1c]/90 backdrop-blur-xl">
        <div className="flex h-14 items-center px-4 md:px-6">
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <BookOpen className="h-5 w-5 text-[var(--accent)]" />
            Diary
          </h1>
        </div>
      </header>
      <div className="p-4 md:p-6 space-y-4">
        <FundamentalsChecklist />
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Chronological feed. Use the + button to add a new entry.
        </p>
        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-dashed border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center text-[var(--muted-foreground)]"
          >
            No entries yet. Tap the + button to add your first note.
          </motion.div>
        ) : (
          <ul className="space-y-3">
            <AnimatePresence mode="popLayout">
              {entries.map((entry, i) => (
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
    </motion.div>
  );
}
