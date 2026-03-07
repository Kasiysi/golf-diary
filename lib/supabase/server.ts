/**
 * Supabase server client for API routes and Server Components.
 * Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 * When you add Auth, use createServerClient from @supabase/ssr and getSession() for getServerUser().
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseServer() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

/** Use in API routes: returns user id when Auth is wired; until then returns null (caller can still use service role for anon flows). */
export async function getServerUser(): Promise<{ id: string } | null> {
  // When using Supabase Auth with cookies:
  // const supabase = createServerClient(...); const { data: { user } } = await supabase.auth.getUser(); return user ? { id: user.id } : null;
  return null;
}
