/**
 * Database schema types for Supabase (Fault-Cure Relational Model).
 * Matches supabase/migrations (simplified 4 categories: long_game, short_game, putting, coach_advice).
 *
 * Use with your existing auth and Supabase client; these types describe table rows.
 */

export type ClubCategory =
  | "long_game"
  | "short_game"
  | "putting"
  | "coach_advice";

export type SwingPhase = "none" | "setup" | "backswing" | "downswing";

export type EntryType = "feel" | "problem" | "drill" | "coach-advice";

export type ContentLanguage = "fi" | "en";

/** JSONB media item (matches MediaItem in lib/types.ts) */
export interface DbMediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
}

/** entries table row */
export interface EntryRow {
  id: string;
  user_id: string;
  club: ClubCategory;
  entry_type: EntryType;
  swing_phase: SwingPhase;
  notes: string;
  problem_notes: string | null;
  cure: string | null;
  youtube_link: string | null;
  media: DbMediaItem[];
  priority: boolean;
  language: ContentLanguage;
  search_summary_english: string | null;
  created_at: string;
  embedding: number[] | null;
}

/** Insert payload for entries (id, created_at, embedding optional) */
export type EntryInsert = Omit<EntryRow, "id" | "created_at" | "embedding"> &
  Partial<Pick<EntryRow, "created_at" | "embedding">> & { id?: string };

/** Update payload for entries (partial) */
export type EntryUpdate = Partial<Omit<EntryRow, "id" | "user_id">>;

/** faults table row */
export interface FaultRow {
  id: string;
  user_id: string;
  entry_id: string | null;
  description: string;
  description_english: string | null;
  created_at: string;
  embedding: number[] | null;
}

export type FaultInsert = Omit<FaultRow, "id" | "created_at" | "embedding"> &
  Partial<Pick<FaultRow, "created_at" | "embedding" | "entry_id">> & { id?: string };

export type FaultUpdate = Partial<Omit<FaultRow, "id" | "user_id">>;

/** cures_feels table row (Checklist = is_priority) */
export interface CureFeelRow {
  id: string;
  user_id: string;
  entry_id: string | null;
  type: EntryType;
  content: string;
  content_english: string | null;
  is_priority: boolean;
  created_at: string;
  embedding: number[] | null;
}

export type CureFeelInsert = Omit<CureFeelRow, "id" | "created_at" | "embedding"> &
  Partial<Pick<CureFeelRow, "created_at" | "embedding" | "entry_id">> & { id?: string };

export type CureFeelUpdate = Partial<Omit<CureFeelRow, "id" | "user_id">>;

/** fault_cure_links join table row */
export interface FaultCureLinkRow {
  id: string;
  fault_id: string;
  cure_id: string;
  linked_at: string;
  note: string | null;
}

export type FaultCureLinkInsert = Omit<FaultCureLinkRow, "id" | "linked_at"> &
  Partial<Pick<FaultCureLinkRow, "linked_at">> & { id?: string };

/** Vector embedding dimension (must match migration: 1536; used with Gemini embedding API outputDimensionality) */
export const EMBEDDING_DIMENSION = 1536;
