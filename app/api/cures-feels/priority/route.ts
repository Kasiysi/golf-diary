/**
 * PATCH /api/cures-feels/priority
 *
 * Updates is_priority (and optionally suggested_video_url) in cures_feels for the given entry_id (or cure_id).
 * Body: { entryId?: string, cureId?: string, priority: boolean, suggestedVideoUrl?: string }
 * At least one of entryId or cureId required. Uses Supabase + FALLBACK_USER_ID_FOR_DEV when not logged in.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, getServerUser, FALLBACK_USER_ID_FOR_DEV } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    const body = await request.json().catch(() => ({}));
    const entryId = typeof body.entryId === "string" ? body.entryId.trim() : undefined;
    const cureId = typeof body.cureId === "string" ? body.cureId.trim() : undefined;
    const priority = typeof body.priority === "boolean" ? body.priority : undefined;
    const suggestedVideoUrl =
      typeof body.suggestedVideoUrl === "string" && body.suggestedVideoUrl.startsWith("http")
        ? body.suggestedVideoUrl.trim()
        : undefined;

    if (priority === undefined) {
      return NextResponse.json({ success: false, error: "priority (boolean) required" }, { status: 400 });
    }
    if (!entryId && !cureId) {
      return NextResponse.json(
        { success: false, error: "entryId or cureId required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 503 });
    }

    const user = await getServerUser();
    const userId = user?.id ?? FALLBACK_USER_ID_FOR_DEV;

    const updatePayload: { is_priority: boolean; suggested_video_url?: string } = { is_priority: priority };
    if (suggestedVideoUrl !== undefined) updatePayload.suggested_video_url = suggestedVideoUrl;

    const { error: err } = cureId
      ? await supabase
          .from("cures_feels")
          .update(updatePayload)
          .eq("id", cureId)
          .eq("user_id", userId)
      : await supabase
          .from("cures_feels")
          .update(updatePayload)
          .eq("entry_id", entryId!)
          .eq("user_id", userId);

    if (err) {
      console.error("[cures-feels/priority]", err);
      return NextResponse.json(
        { success: false, error: err.message ?? "Update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
