"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { DiaryEntry } from "./types";
import { EntryDetailModal } from "@/components/entry-detail-modal";

type EntryDetailContextValue = {
  openEntryDetail: (entry: DiaryEntry) => void;
  closeEntryDetail: () => void;
};

const EntryDetailContext = createContext<EntryDetailContextValue | null>(null);

export function EntryDetailProvider({ children }: { children: React.ReactNode }) {
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  const openEntryDetail = useCallback((entry: DiaryEntry) => {
    setSelectedEntry(entry);
  }, []);

  const closeEntryDetail = useCallback(() => {
    setSelectedEntry(null);
  }, []);

  return (
    <EntryDetailContext.Provider value={{ openEntryDetail, closeEntryDetail }}>
      {children}
      <EntryDetailModal
        entry={selectedEntry}
        open={selectedEntry !== null}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      />
    </EntryDetailContext.Provider>
  );
}

export function useEntryDetail(): EntryDetailContextValue | null {
  return useContext(EntryDetailContext);
}

/** Use when EntryCard should open detail view: from context if available, else from optional onEntryClick prop. */
export function useOpenEntryDetail(onEntryClick?: (entry: DiaryEntry) => void): [(entry: DiaryEntry) => void, boolean] {
  const ctx = useEntryDetail();
  const openEntryDetail = useCallback(
    (entry: DiaryEntry) => {
      if (ctx) ctx.openEntryDetail(entry);
      else onEntryClick?.(entry);
    },
    [ctx, onEntryClick]
  );
  const isClickable = ctx !== null || onEntryClick !== undefined;
  return [openEntryDetail, isClickable];
}
