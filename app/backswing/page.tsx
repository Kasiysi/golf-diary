"use client";

import { useState } from "react";
import { useEntries } from "@/lib/entries-context";
import { EntryCard } from "@/components/entry-card";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { ArrowUpFromLine } from "lucide-react";

export default function BackswingPage() {
  const entries = useEntries();
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const filtered = entries.filter((e) => e.swingPhase === "backswing");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-white shadow-sm">
        <div className="flex h-14 items-center px-4 md:px-6">
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <ArrowUpFromLine className="h-5 w-5 text-[var(--accent)]" />
            Backswing
          </h1>
        </div>
      </header>
      <div className="p-4 md:p-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Entries tagged with Backswing (any club).
        </p>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-muted)] p-8 text-center text-[var(--muted-foreground)]">
            No backswing entries yet. Add an entry and set Swing Phase to Backswing.
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
