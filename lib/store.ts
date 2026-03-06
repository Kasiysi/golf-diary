"use client";

import type { DiaryEntry, MediaItem } from "./types";

const STORAGE_KEY = "golf-diary-entries";

function loadEntries(): DiaryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultEntries();
  } catch {
    return getDefaultEntries();
  }
}

function saveEntries(entries: DiaryEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function getDefaultEntries(): DiaryEntry[] {
  return [
    {
      id: "1",
      club: "driver",
      entryType: "feel",
      notes: "Smooth tempo – 'low and slow' on the takeaway.",
      media: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "2",
      club: "wedges",
      entryType: "problem",
      notes: "",
      problemNotes: "Chunking 56° from 50 yards – decelerating through impact.",
      cure: "Accelerate through the ball; feel like the club passes the hands.",
      media: [],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "3",
      club: "putter",
      entryType: "coach-advice",
      notes: "Keep head still; stroke with shoulders, not hands.",
      media: [],
      createdAt: new Date().toISOString(),
    },
  ];
}

export function getEntries(): DiaryEntry[] {
  return loadEntries();
}

export function addEntry(
  entry: Omit<DiaryEntry, "id"> & { createdAt?: string }
): DiaryEntry {
  const entries = loadEntries();
  const newEntry: DiaryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: entry.createdAt ?? new Date().toISOString(),
  };
  entries.unshift(newEntry);
  saveEntries(entries);
  return newEntry;
}

export function updateEntry(
  entryId: string,
  updates: Partial<Omit<DiaryEntry, "id">>
): DiaryEntry | null {
  const entries = loadEntries();
  const idx = entries.findIndex((e) => e.id === entryId);
  if (idx === -1) return null;
  const existing = entries[idx];
  entries[idx] = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: updates.createdAt ?? existing.createdAt,
  };
  saveEntries(entries);
  return entries[idx];
}

export function togglePriority(entryId: string): boolean | null {
  const entries = loadEntries();
  const idx = entries.findIndex((e) => e.id === entryId);
  if (idx === -1) return null;
  const entry = entries[idx];
  entries[idx] = { ...entry, priority: !entry.priority };
  saveEntries(entries);
  return entries[idx].priority ?? false;
}

export function deleteEntry(entryId: string): boolean {
  const entries = loadEntries();
  const idx = entries.findIndex((e) => e.id === entryId);
  if (idx === -1) return false;
  entries.splice(idx, 1);
  saveEntries(entries);
  return true;
}

export function addMediaToEntry(
  entryId: string,
  media: Omit<MediaItem, "id" | "createdAt">
): void {
  const entries = loadEntries();
  const idx = entries.findIndex((e) => e.id === entryId);
  if (idx === -1) return;
  const newMedia: MediaItem = {
    ...media,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  entries[idx].media.push(newMedia);
  saveEntries(entries);
}

export function getEntriesByClub(club: DiaryEntry["club"]): DiaryEntry[] {
  return loadEntries().filter((e) => e.club === club);
}

export function getAllMediaForClub(club: DiaryEntry["club"]): MediaItem[] {
  return loadEntries()
    .filter((e) => e.club === club)
    .flatMap((e) => e.media);
}
