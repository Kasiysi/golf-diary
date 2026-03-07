/**
 * Supabase server client for API routes and Server Components.
 * Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from env.
 * When you add Auth, use createServerClient from @supabase/ssr and getSession() for getServerUser().
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

export function getSupabaseServer() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

/** Use in API routes: returns user id when Auth is wired; until then returns null (caller can still use anon for public flows). */
export async function getServerUser(): Promise<{ id: string } | null> {
  // When using Supabase Auth with cookies:
  // const supabase = createServerClient(...); const { data: { user } } = await supabase.auth.getUser(); return user ? { id: user.id } : null;
  return null;
}
