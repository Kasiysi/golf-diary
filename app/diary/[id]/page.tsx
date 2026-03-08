"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEntries } from "@/lib/entries-context";
import { EntryDetailView } from "@/components/entry-detail-view";
import { ArrowLeft } from "lucide-react";

export default function DiaryEntryPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : null;
  const entries = useEntries();
  const entry = id ? entries.find((e) => e.id === id) ?? null : null;

  if (!id || !entry) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-[var(--muted-foreground)]">Entry not found.</p>
        <Link
          href="/diary"
          className="inline-flex items-center gap-2 text-[var(--accent)] font-medium hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Diary
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-white/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 md:px-6 h-14">
          <Link
            href="/diary"
            className="p-2 -ml-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Back to Diary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm text-[var(--muted-foreground)]">Entry</span>
        </div>
      </header>
      <EntryDetailView entry={entry} standalone />
    </div>
  );
}
