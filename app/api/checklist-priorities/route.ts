/**
 * GET /api/checklist-priorities
 *
 * Returns Top 3 (or N) priority cures/feels for the Quick-Check Dashboard.
 * Reads from cures_feels (instruction, instruction_english). Only rows with is_priority = true.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, getServerUser, FALLBACK_USER_ID_FOR_DEV } from "@/lib/supabase/server";

export interface ChecklistPriorityItem {
  id: string;
  content: string;
  contentEnglish: string | null;
  type: string;
  createdAt: string;
  /** AI Coach suggested YouTube URL (from cures_feels.suggested_video_url) */
  suggestedVideoUrl?: string | null;
}

export interface ChecklistPrioritiesResponse {
  items: ChecklistPriorityItem[];
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<ChecklistPrioritiesResponse>> {
  try {
    const limit = Math.min(10, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 3));
    const supabase = getSupabaseServer();
    const user = await getServerUser();
    // Temporary: use fallback user ID when not logged in so you can test on device
    const userId = user?.id ?? FALLBACK_USER_ID_FOR_DEV;

    if (!supabase) {
      return NextResponse.json({ items: [] });
    }

    // cures_feels: instruction, instruction_english, suggested_video_url; only is_priority = true
    const { data, error } = await supabase
      .from("cures_feels")
      .select("id, instruction, instruction_english, type, created_at, suggested_video_url")
      .eq("user_id", userId)
      .eq("is_priority", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ items: [], error: error.message });
    }

    type CureRow = {
      id: string;
      instruction?: string | null;
      instruction_english?: string | null;
      type: string;
      created_at: string;
      suggested_video_url?: string | null;
    };
    const rows = (data ?? []) as CureRow[];
    const items: ChecklistPriorityItem[] = rows.map((row) => ({
      id: row.id,
      content: row.instruction ?? "",
      contentEnglish: row.instruction_english ?? null,
      type: row.type,
      createdAt: row.created_at,
      suggestedVideoUrl: row.suggested_video_url ?? null,
    }));

    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ items: [], error: message }, { status: 500 });
  }
}
