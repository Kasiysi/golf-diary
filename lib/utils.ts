import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extract first YouTube video ID from text (youtube.com/watch?v=ID or youtu.be/ID). */
export function getYouTubeVideoId(text: string): string | null {
  const match =
    text.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/) ?? null;
  return match ? match[1] : null;
}
