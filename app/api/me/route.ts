/**
 * GET /api/me
 * Returns the current session user (id, email) for session check / debugging.
 * No cache so each request reflects current auth state.
 */

import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const user = await getServerUser();
  return NextResponse.json(
    { user: user ? { id: user.id, email: user.email ?? null } : null },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
