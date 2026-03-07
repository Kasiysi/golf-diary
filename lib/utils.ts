import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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
