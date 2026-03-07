/**
 * Generated Supabase DB types for the fault-cure schema.
 * Regenerate with: npx supabase gen types typescript --project-id YOUR_REF > lib/supabase/database.types.ts
 * Until then this minimal shape supports RPC and table access.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ClubCategory =
  | "long_game"
  | "short_game"
  | "putting"
  | "coach_advice";

export type SwingPhase = "none" | "setup" | "backswing" | "downswing";

export type EntryType = "feel" | "problem" | "drill" | "coach-advice";

export type ContentLanguage = "fi" | "en";

export interface Database {
  public: {
    Tables: {
      entries: {
        Row: {
          id: string;
          user_id: string;
          club: ClubCategory;
          entry_type: EntryType;
          swing_phase: SwingPhase;
          notes: string;
          problem_notes: string | null;
          cure: string | null;
          youtube_link: string | null;
          media: Json;
          priority: boolean;
          language: ContentLanguage;
          search_summary_english: string | null;
          created_at: string;
          embedding: number[] | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      faults: {
        Row: {
          id: string;
          user_id: string;
          entry_id: string | null;
          description: string;
          description_english: string | null;
          created_at: string;
          embedding: number[] | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      cures_feels: {
        Row: {
          id: string;
          user_id: string;
          entry_id: string | null;
          type: EntryType;
          instruction: string;
          instruction_english: string | null;
          is_priority: boolean;
          suggested_video_url: string | null;
          created_at: string;
          embedding: number[] | null;
        };
        Insert: Record<string, unknown>;
        Update: Partial<{
          entry_id: string | null;
          type: EntryType;
          instruction: string;
          instruction_english: string | null;
          is_priority: boolean;
          suggested_video_url: string | null;
          created_at: string;
          embedding: number[] | null;
        }>;
      };
      fault_cure_links: {
        Row: {
          id: string;
          fault_id: string;
          cure_id: string;
          linked_at: string;
          note: string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Functions: {
      match_cures_by_query: {
        Args: {
          query_embedding: number[];
          p_user_id: string;
          match_limit?: number;
        };
        Returns: {
          cure_id: string;
          cure_content: string;
          cure_content_english: string | null;
          cure_type: EntryType;
          fault_id: string;
          fault_description: string;
          fault_description_english: string | null;
          similarity: number;
        };
      };
      match_cures_direct: {
        Args: {
          query_embedding: number[];
          p_user_id: string;
          match_limit?: number;
        };
        Returns: {
          id: string;
          content: string;
          content_english: string | null;
          type: EntryType;
          is_priority: boolean;
          similarity: number;
        };
      };
    };
  };
}
