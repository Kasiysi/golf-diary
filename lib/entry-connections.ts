"use client";

import type { EntryConnection } from "./types";

const STORAGE_KEY = "golf-diary-entry-connections";

function loadConnections(): EntryConnection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConnections(connections: EntryConnection[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
}

/** Get all connection rows for the app (for migration/debug). */
export function getAllConnections(): EntryConnection[] {
  return loadConnections();
}

/** Get linked entry IDs for a given entry (this entry -> those entries). */
export function getLinkedEntryIds(entryId: string): string[] {
  const connections = loadConnections();
  return connections
    .filter((c) => c.entryId === entryId)
    .map((c) => c.linkedEntryId);
}

/** Add a single link from entryId to linkedEntryId. Idempotent (no duplicate). */
export function addConnection(entryId: string, linkedEntryId: string): void {
  if (entryId === linkedEntryId) return;
  const connections = loadConnections();
  const exists = connections.some(
    (c) => c.entryId === entryId && c.linkedEntryId === linkedEntryId
  );
  if (exists) return;
  connections.push({
    id: crypto.randomUUID(),
    entryId,
    linkedEntryId,
    createdAt: new Date().toISOString(),
  });
  saveConnections(connections);
}

/** Remove a single link. */
export function removeConnection(entryId: string, linkedEntryId: string): void {
  const connections = loadConnections().filter(
    (c) => !(c.entryId === entryId && c.linkedEntryId === linkedEntryId)
  );
  saveConnections(connections);
}

/** Set all links from entryId to exactly the given linkedEntryIds (replaces existing). */
export function setConnectionsForEntry(entryId: string, linkedEntryIds: string[]): void {
  const connections = loadConnections();
  const others = connections.filter((c) => c.entryId !== entryId);
  const newLinks = linkedEntryIds
    .filter((id) => id !== entryId)
    .map((linkedEntryId) => ({
      id: crypto.randomUUID(),
      entryId,
      linkedEntryId,
      createdAt: new Date().toISOString(),
    }));
  saveConnections([...others, ...newLinks]);
}
