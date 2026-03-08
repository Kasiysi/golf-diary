export type ClubCategory =
  | "long-game"
  | "short-game"
  | "putting"
  | "coach-advice";

export type SwingPhase = "none" | "setup" | "backswing" | "downswing";

export type EntryType = "feel" | "problem" | "drill" | "coach-advice";

export type MediaType = "image" | "video";

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string; // for video thumbnails
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  club: ClubCategory;
  entryType: EntryType;
  /** Swing phase tag: none, setup, backswing, downswing */
  swingPhase?: SwingPhase;
  notes: string;
  /** When entryType is "problem": the problem description */
  problemNotes?: string;
  /** When entryType is "problem": the fix/cure */
  cure?: string;
  /** Dedicated YouTube URL (optional) */
  youtubeLink?: string;
  media: MediaItem[];
  priority?: boolean;
  /** English summary for Finnish notes; used for semantic search */
  searchSummaryEnglish?: string | null;
  /** AI Coach: suggested YouTube tutorial URL (from Gemini when analyzing Finnish notes) */
  suggestedVideoUrl?: string | null;
  /** Display title / instruction (e.g. from checklist or AI summary) */
  instruction?: string | null;
  /** English version of instruction */
  instruction_english?: string | null;
  createdAt: string;
}
