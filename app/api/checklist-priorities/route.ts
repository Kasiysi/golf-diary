/**
 * GET /api/checklist-priorities
 *
 * Returns Top 3 (or N) from cures_feels where is_priority = true, ordered by created_at desc.
 * No separate Checklist table. Used by Quick-Check Dashboard.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, getServerUser, FALLBACK_USER_ID_FOR_DEV } from "@/lib/supabase/server";

export interface ChecklistPriorityItem {
  id: string;
  content: string;
  contentEnglish: string | null;
  type: string;
  club: string | null;
  createdAt: string;
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

    const { data, error } = await supabase
      .from("cures_feels")
      .select("id, instruction, instruction_english, type, created_at, suggested_video_url, club")
      .eq("user_id", userId)
      .eq("is_priority", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ items: [], error: error.message }, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }

    type CureRow = {
      id: string;
      instruction?: string | null;
      instruction_english?: string | null;
      type: string;
      created_at: string;
      suggested_video_url?: string | null;
      club?: string | null;
    };
    const rows = (data ?? []) as CureRow[];
    const items: ChecklistPriorityItem[] = rows.map((row) => ({
      id: row.id,
      content: row.instruction ?? "",
      contentEnglish: row.instruction_english ?? null,
      type: row.type,
      club: row.club ?? null,
      createdAt: row.created_at,
      suggestedVideoUrl: row.suggested_video_url ?? null,
    }));

    return NextResponse.json({ items }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ items: [], error: message }, {
      status: 500,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  }
}
