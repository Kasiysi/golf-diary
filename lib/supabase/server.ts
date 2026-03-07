/**
 * Supabase server client for API routes and Server Components.
 * Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (read at request time).
 * getServerUser() reads the session from Supabase Auth cookies (SSR).
 */

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/** Temporary: use this user ID when not logged in so you can test search/checklist on device. Create this user in Supabase Auth or use your own UUID. */
export const FALLBACK_USER_ID_FOR_DEV = "00000000-0000-4000-8000-000000000001";

function getSupabaseEnv() {
  const url =
    (typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" && process.env.NEXT_PUBLIC_SUPABASE_URL.trim()) ||
    (typeof process.env.SUPABASE_URL === "string" && process.env.SUPABASE_URL.trim()) ||
    "";
  const anonKey =
    (typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()) ||
    (typeof process.env.SUPABASE_ANON_KEY === "string" && process.env.SUPABASE_ANON_KEY.trim()) ||
    "";
  return { url, anonKey };
}

export function getSupabaseServer() {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) return null;
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false },
  });
}

/** Returns the current user from Supabase Auth cookies (session). Use in API routes and Server Components.
 * Reads session from request cookies so mobile and desktop browsers authenticate the same way.
 * When no session, returns null (callers may use FALLBACK_USER_ID_FOR_DEV for testing). */
export async function getServerUser(): Promise<{ id: string } | null> {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) return null;

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignored when called from Route Handler (e.g. middleware handles refresh)
        }
      },
    },
  });

  // getSession() reads from cookies and is reliable on mobile; getUser() uses the same session
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  return user ? { id: user.id } : null;
}
