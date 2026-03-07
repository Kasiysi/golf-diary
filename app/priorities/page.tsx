"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEntries } from "@/lib/entries-context";
import { usePinnedPlan } from "@/lib/pinned-plan-context";
import { EntryCard } from "@/components/entry-card";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { QuickCheckDashboard } from "@/components/quick-check-dashboard";
import { Star, PinOff } from "lucide-react";

export default function PrioritiesPage() {
  const entries = useEntries();
  const { pinnedPlan, setPinnedPlan } = usePinnedPlan();
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const filtered = entries.filter((e) => e.priority === true);

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
            <Star className="h-5 w-5 text-[var(--accent)]" />
            Priorities
          </h1>
        </div>
      </header>
      <div className="p-4 md:p-6 space-y-4">
        <QuickCheckDashboard />
        {pinnedPlan && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                Pinned Practice Plan
              </span>
              <button
                type="button"
                onClick={() => setPinnedPlan(null)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-[var(--muted-foreground)] hover:bg-white/10 hover:text-[var(--foreground)]"
                aria-label="Unpin practice plan"
              >
                <PinOff className="h-3.5 w-3.5" />
                Unpin
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
                  Core Focus
                </h3>
                <p className="text-sm text-[var(--foreground)]">{pinnedPlan.coreFocus}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
                  The Feel List
                </h3>
                <ul className="list-disc list-inside space-y-0.5 text-sm text-[var(--foreground)]">
                  {pinnedPlan.feelList.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
                  The Drill Plan
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-[var(--foreground)]">
                  {pinnedPlan.drillPlan.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </motion.section>
        )}
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Entries you&apos;ve marked as priority.
        </p>
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-dashed border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center text-[var(--muted-foreground)]"
          >
            No priority entries yet. Use the star on any card to mark it.
          </motion.div>
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
    </motion.div>
  );
}
