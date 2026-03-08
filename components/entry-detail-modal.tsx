"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EntryDetailView } from "@/components/entry-detail-view";
import type { DiaryEntry } from "@/lib/types";
import { useEntries, useDeleteEntry } from "@/lib/entries-context";
import { X, ExternalLink, ArrowLeft, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDeleteEntryModal } from "@/components/confirm-delete-entry-modal";

const ENTRY_MODAL_Z = "z-[200]";

type Props = {
  entry: DiaryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVideoClick?: (url: string) => void;
};

export function EntryDetailModal({
  entry,
  open,
  onOpenChange,
  onVideoClick,
}: Props) {
  const entries = useEntries();
  const deleteEntry = useDeleteEntry();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName={ENTRY_MODAL_Z}
        className={cn(
          "fixed inset-0 max-w-none max-h-none w-full h-full translate-x-0 translate-y-0 rounded-none border-0 bg-white p-0 overflow-auto",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "[&>button]:hidden",
          ENTRY_MODAL_Z
        )}
        aria-describedby={undefined}
      >
        <div className="sticky top-0 z-10 flex justify-between items-center gap-3 border-b border-[var(--border)] bg-white/95 backdrop-blur px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[var(--foreground)] font-medium",
                "hover:bg-[var(--muted)] transition-colors touch-manipulation"
              )}
              aria-label="Takaisin listaan"
            >
              <ArrowLeft className="h-5 w-5 shrink-0" />
              <span>Takaisin</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {entry ? (
              <Link
                href={`/diary/${entry.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Avaa sivulla</span>
              </Link>
            ) : null}
            {entry ? (
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-red-500/20 hover:text-red-500 transition-colors touch-manipulation"
                aria-label="Delete entry"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors touch-manipulation"
              aria-label="Sulje"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        {entry ? (
          <EntryDetailView
            entry={entry}
            allEntries={entries}
            onVideoClick={onVideoClick}
          />
        ) : null}
      </DialogContent>
      <ConfirmDeleteEntryModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={() => {
          if (entry) {
            deleteEntry(entry.id);
            onOpenChange(false);
          }
        }}
      />
    </Dialog>
  );
}
