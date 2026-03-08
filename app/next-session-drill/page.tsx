"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEntries } from "@/lib/entries-context";
import { EntryCard } from "@/components/entry-card";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { Dumbbell } from "lucide-react";

export default function NextSessionDrillPage() {
  const entries = useEntries();
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);

  const drillEntries = [...entries]
    .filter((e) => e.entryType === "drill")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const newestDrill = drillEntries[0] ?? null;
  const restDrills = drillEntries.slice(1);

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
            <Dumbbell className="h-5 w-5 text-[var(--accent)]" />
            Next Session Drill
          </h1>
        </div>
      </header>

      <div className="p-4 md:p-6 space-y-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Newest drill for your next session (top). Older drills below.
        </p>

        {drillEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-muted)] p-8 text-center text-[var(--muted-foreground)]"
          >
            No drill entries yet. Add a drill from the Diary (+ button, then choose type Drill).
          </motion.div>
        ) : (
          <>
            {newestDrill && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
                  Up next
                </p>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <EntryCard
                    entry={newestDrill}
                    onVideoClick={(url) => setVideoModalUrl(url)}
                  />
                </motion.div>
              </section>
            )}
            {restDrills.length > 0 && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                  Other recent drills
                </p>
                <ul className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {restDrills.map((entry, i) => (
                      <motion.li
                        key={entry.id}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.25, delay: (i + 1) * 0.03 }}
                      >
                        <EntryCard
                          entry={entry}
                          onVideoClick={(url) => setVideoModalUrl(url)}
                        />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      <VideoPlayerModal
        url={videoModalUrl}
        open={videoModalUrl !== null}
        onOpenChange={(open) => !open && setVideoModalUrl(null)}
      />
    </motion.div>
  );
}
