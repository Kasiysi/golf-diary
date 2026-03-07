/**
 * PATCH /api/cures-feels/priority
 *
 * Updates is_priority (and optionally suggested_video_url) in cures_feels for the given entry_id (or cure_id).
 * Body: { entryId?, cureId?, priority, suggestedVideoUrl?, instruction?, instruction_english?, type? }
 * When updating by entry_id and no row exists, inserts a row so the dashboard can show it (no separate Checklist table).
 * At least one of entryId or cureId required. Uses Supabase + FALLBACK_USER_ID_FOR_DEV when not logged in.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, getServerUser, FALLBACK_USER_ID_FOR_DEV } from "@/lib/supabase/server";

const VALID_ENTRY_TYPES = ["feel", "problem", "drill", "coach-advice"] as const;

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
    const instruction = typeof body.instruction === "string" ? body.instruction.trim() : "";
    const instructionEnglish =
      typeof body.instruction_english === "string" ? body.instruction_english.trim() : null;
    const type = VALID_ENTRY_TYPES.includes(body.type) ? body.type : "feel";
    const club = ["long-game", "short-game", "putting", "coach-advice"].includes(body.club) ? body.club : null;

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

    const updatePayload = { is_priority: priority, ...(suggestedVideoUrl !== undefined && { suggested_video_url: suggestedVideoUrl }) };

    if (cureId) {
      const { error: err } = await supabase
        .from("cures_feels")
        // @ts-ignore - Vercel build: update() param inferred as never
        .update(updatePayload as any)
        .eq("id", cureId)
        .eq("user_id", userId);
      if (err) {
        console.error("[cures-feels/priority]", err);
        return NextResponse.json({ success: false, error: err.message ?? "Update failed" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Update by entry_id
    const { data: updated, error: updateErr } = await supabase
      .from("cures_feels")
      // @ts-ignore - Vercel build: update() param inferred as never
      .update(updatePayload as any)
      .eq("entry_id", entryId!)
      .eq("user_id", userId)
      .select("id");

    if (updateErr) {
      console.error("[cures-feels/priority]", updateErr);
      return NextResponse.json({ success: false, error: updateErr.message ?? "Update failed" }, { status: 500 });
    }

    // If no row exists and we're setting priority true, insert so the dashboard can show it
    if (priority && (!updated || updated.length === 0)) {
      const insertPayload = {
        user_id: userId,
        entry_id: entryId,
        type,
        instruction: instruction || "(pinned entry)",
        instruction_english: instructionEnglish,
        is_priority: true,
        suggested_video_url: suggestedVideoUrl ?? null,
        club,
      };
      // @ts-ignore - Vercel build: Supabase insert type; payload matches cures_feels columns
      const { error: insertErr } = await supabase.from("cures_feels").insert(insertPayload as any);
      if (insertErr) {
        console.error("[cures-feels/priority] insert", insertErr);
        return NextResponse.json({ success: false, error: insertErr.message ?? "Insert failed" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
