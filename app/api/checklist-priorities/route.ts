/**
 * GET /api/checklist-priorities
 *
 * Returns Top 3 (or N) priority cures/feels for the Quick-Check Dashboard.
 * Uses Supabase when configured; requires auth. Until then returns empty array.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, getServerUser } from "@/lib/supabase/server";

export interface ChecklistPriorityItem {
  id: string;
  content: string;
  contentEnglish: string | null;
  type: string;
  createdAt: string;
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

    if (!supabase || !user?.id) {
      return NextResponse.json({ items: [] });
    }

    const { data, error } = await supabase
      .from("cures_feels")
      .select("id, content, content_english, type, created_at")
      .eq("user_id", user.id)
      .eq("is_priority", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ items: [], error: error.message });
    }

    type CureRow = { id: string; content: string; content_english: string | null; type: string; created_at: string };
    const rows = (data ?? []) as CureRow[];
    const items: ChecklistPriorityItem[] = rows.map((row) => ({
      id: row.id,
      content: row.content,
      contentEnglish: row.content_english ?? null,
      type: row.type,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ items });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ items: [], error: message }, { status: 500 });
  }
}
