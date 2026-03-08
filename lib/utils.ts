import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DiaryEntry, MediaItem } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extract first YouTube video ID from text. Supports watch, Shorts, and youtu.be. Embed URL is always youtube.com/embed/ID. */
export function getYouTubeVideoId(text: string): string | null {
  const match =
    text.match(
      /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    ) ?? null;
  return match ? match[1] : null;
}

const UTFS_IO_ORIGIN = "https://utfs.io";

/** Ensure media URLs are full (https://utfs.io/... or other absolute URL). Never returns undefined. */
export function fullMediaUrl(url: string | undefined | null): string {
  if (url == null || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${UTFS_IO_ORIGIN}${path}`;
}

/**
 * Media mapping: always use this to get media for a given entry so the correct files
 * are shown for that entry (by entry.id). When using Supabase Storage, resolve URLs
 * from the bucket path for this entry (e.g. diary/{entryId}/*).
 */
export function getEntryMedia(entry: DiaryEntry | null | undefined): MediaItem[] {
  if (!entry?.id) return [];
  return Array.isArray(entry.media) ? entry.media : [];
}
