"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { DiaryEntry } from "./types";
import { getEntries as loadEntries, addEntry as persistEntry, updateEntry as persistUpdateEntry, togglePriority as persistTogglePriority, deleteEntry as persistDeleteEntry } from "./store";

type EntriesContextValue = {
  entries: DiaryEntry[];
  refresh: () => void;
  addEntry: (entry: Omit<DiaryEntry, "id"> & { createdAt?: string }) => DiaryEntry;
  updateEntry: (entryId: string, updates: Partial<Omit<DiaryEntry, "id">>) => DiaryEntry | null;
  togglePriority: (entryId: string) => void;
  deleteEntry: (entryId: string) => void;
};

const EntriesContext = createContext<EntriesContextValue | null>(null);

export function EntriesProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const router = useRouter();

  const refresh = useCallback(() => {
    setEntries(loadEntries());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEntry = useCallback(
    (entry: Omit<DiaryEntry, "id"> & { createdAt?: string }) => {
      const newEntry = persistEntry(entry);
      setEntries(loadEntries());
      return newEntry;
    },
    []
  );

  const updateEntry = useCallback(
    (entryId: string, updates: Partial<Omit<DiaryEntry, "id">>) => {
      const updated = persistUpdateEntry(entryId, updates);
      setEntries(loadEntries());
      return updated;
    },
    []
  );

  const togglePriority = useCallback((entryId: string) => {
    persistTogglePriority(entryId);
    setEntries(loadEntries());
    const entries = loadEntries();
    const entry = entries.find((e) => e.id === entryId);
    const newPriority = entry?.priority ?? false;
    const instruction =
      entry?.cure ?? entry?.notes ?? entry?.problemNotes ?? "";
    fetch("/api/cures-feels/priority", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entryId,
        priority: newPriority,
        ...(entry?.suggestedVideoUrl && { suggestedVideoUrl: entry.suggestedVideoUrl }),
        ...(newPriority && {
          instruction,
          instruction_english: entry?.searchSummaryEnglish ?? undefined,
          type: entry?.entryType ?? "feel",
        }),
      }),
    })
      .then((res) => res.json())
      .then((data: { success?: boolean }) => {
        if (data.success && typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("checklist-priorities-refresh"));
          router.refresh();
        }
      })
      .catch(() => {});
  }, [router]);

  const deleteEntry = useCallback((entryId: string) => {
    persistDeleteEntry(entryId);
    setEntries(loadEntries());
  }, []);

  return (
    <EntriesContext.Provider value={{ entries, refresh, addEntry, updateEntry, togglePriority, deleteEntry }}>
      {children}
    </EntriesContext.Provider>
  );
}

export function useEntries(): DiaryEntry[] {
  const ctx = useContext(EntriesContext);
  return ctx?.entries ?? [];
}

export function useAddEntry() {
  const ctx = useContext(EntriesContext);
  return ctx?.addEntry ?? (() => ({} as DiaryEntry));
}

export function useRefreshEntries() {
  const ctx = useContext(EntriesContext);
  return ctx?.refresh ?? (() => {});
}

export function useUpdateEntry() {
  const ctx = useContext(EntriesContext);
  return ctx?.updateEntry ?? (() => null);
}

export function useTogglePriority() {
  const ctx = useContext(EntriesContext);
  return ctx?.togglePriority ?? (() => {});
}

export function useDeleteEntry() {
  const ctx = useContext(EntriesContext);
  return ctx?.deleteEntry ?? (() => {});
}
