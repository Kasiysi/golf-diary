"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEntries, useDeleteEntry } from "@/lib/entries-context";
import { EntryDetailView } from "@/components/entry-detail-view";
import { ConfirmDeleteEntryModal } from "@/components/confirm-delete-entry-modal";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function DiaryEntryPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : null;
  const entries = useEntries();
  const deleteEntry = useDeleteEntry();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
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
        <div className="flex items-center justify-between gap-3 px-4 md:px-6 h-14">
          <div className="flex items-center gap-2">
            <Link
              href="/diary"
              className="p-2 -ml-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              aria-label="Back to Diary"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="text-sm text-[var(--muted-foreground)]">Entry</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteConfirmOpen(true)}
            className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-red-500/20 hover:text-red-500 transition-colors"
            aria-label="Delete entry"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </header>
      <EntryDetailView
        entry={entry}
        allEntries={entries}
        standalone
        onOpenLinkedEntry={(e) => router.push(`/diary/${e.id}`)}
      />
      <ConfirmDeleteEntryModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={() => {
          if (entry) {
            deleteEntry(entry.id);
            router.push("/diary");
          }
        }}
      />
    </div>
  );
}
