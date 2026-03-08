"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { DiaryEntry } from "@/lib/types";
import { ENTRY_TYPES } from "@/lib/constants";
import { setConnectionsForEntry } from "@/lib/entry-connections";
import { cn } from "@/lib/utils";

const ENTRY_TYPE_LABELS: Record<string, string> = {
  feel: "Feel",
  problem: "Problem",
  drill: "Drill",
  "coach-advice": "Coach's Advice",
};

type Props = {
  entry: DiaryEntry;
  allEntries: DiaryEntry[];
  currentLinkedIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function LinkEntryPickerModal({
  entry,
  allEntries,
  currentLinkedIds,
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentLinkedIds));

  useEffect(() => {
    if (open) setSelectedIds(new Set(currentLinkedIds));
  }, [open, currentLinkedIds]);

  const otherEntries = allEntries.filter((e) => e.id !== entry.id);
  const instruction = (e: DiaryEntry) =>
    e.instruction ?? (e.entryType === "problem" && e.cure ? e.cure : e.notes);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    setConnectionsForEntry(entry.id, Array.from(selectedIds));
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-heading text-[var(--heading)]">
            Link to another entry
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[var(--muted-foreground)]">
          Select one or more entries to link from this one.
        </p>
        <div className="flex-1 overflow-y-auto min-h-0 border border-[var(--border)] rounded-xl divide-y divide-[var(--border)]">
          {otherEntries.length === 0 ? (
            <div className="p-4 text-sm text-[var(--muted-foreground)]">
              No other entries to link.
            </div>
          ) : (
            otherEntries.map((e) => (
              <label
                key={e.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer hover:bg-[var(--muted)]/50 transition-colors",
                  selectedIds.has(e.id) && "bg-[var(--accent)]/5"
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(e.id)}
                  onChange={() => toggle(e.id)}
                  className="mt-1 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                    {ENTRY_TYPE_LABELS[e.entryType] ?? e.entryType}
                  </span>
                  <p className="mt-0.5 text-sm text-[var(--foreground)] line-clamp-2">
                    {instruction(e) || "Untitled"}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] hover:opacity-90"
          >
            Save links
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
