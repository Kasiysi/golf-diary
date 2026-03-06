"use client";

import { useState } from "react";
import { useEntries } from "@/lib/entries-context";
import { EntryCard } from "@/components/entry-card";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { MessageSquare } from "lucide-react";

export default function CoachAdvicePage() {
  const entries = useEntries();
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const filtered = entries.filter((e) => e.entryType === "coach-advice");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#1a1a1c]/90 backdrop-blur-xl">
        <div className="flex h-14 items-center px-4 md:px-6">
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <MessageSquare className="h-5 w-5 text-[var(--accent)]" />
            Coach Advice
          </h1>
        </div>
      </header>
      <div className="p-4 md:p-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Entries marked as Coach&apos;s Advice.
        </p>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center text-[var(--muted-foreground)]">
            No coach advice entries yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((entry) => (
              <li key={entry.id}>
                <EntryCard
                  entry={entry}
                  onVideoClick={(url) => setVideoModalUrl(url)}
                />
              </li>
            ))}
          </ul>
        )}
        <VideoPlayerModal
          url={videoModalUrl}
          open={videoModalUrl !== null}
          onOpenChange={(open) => !open && setVideoModalUrl(null)}
        />
      </div>
    </div>
  );
}
