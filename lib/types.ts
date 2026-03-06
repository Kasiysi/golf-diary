export type ClubCategory =
  | "driver"
  | "woods"
  | "long-irons"
  | "short-irons"
  | "wedges"
  | "putter"
  | "setup"
  | "anything";

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
  createdAt: string;
}

export interface PracticePlan {
  coreFocus: string;
  feelList: string[];
  drillPlan: string[];
  generatedAt: string;
}
