/**
 * POST /api/semantic-search
 * Vector search: embed query with Gemini (embedding-001), then match via Supabase RPC.
 * Supabase keys are read at request time to avoid "not configured" errors.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getServerUser } from "@/lib/supabase/server";

// Use embedding-001 (text-embedding-004 may 404 on some projects; switch if yours supports it)
const EMBEDDING_MODEL = "models/embedding-001";
const EMBED_DIM = 1536;

export interface SemanticSearchMatch {
  cureId: string;
  cureContent: string;
  cureContentEnglish: string | null;
  cureType: string;
  faultId?: string;
  faultDescription?: string;
  faultDescriptionEnglish?: string | null;
  similarity: number;
}

export interface SemanticSearchResponse {
  matches: SemanticSearchMatch[];
  error?: string;
}

function getSupabaseClient() {
  const url =
    (typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" && process.env.NEXT_PUBLIC_SUPABASE_URL.trim()) ||
    (typeof process.env.SUPABASE_URL === "string" && process.env.SUPABASE_URL.trim()) ||
    "";
  const anonKey =
    (typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()) ||
    (typeof process.env.SUPABASE_ANON_KEY === "string" && process.env.SUPABASE_ANON_KEY.trim()) ||
    "";
  if (!url || !anonKey) return null;
  return createClient<Database>(url, anonKey, { auth: { persistSession: false } });
}

async function getEmbedding(query: string, apiKey: string): Promise<number[] | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      content: { parts: [{ text: query }] },
      outputDimensionality: EMBED_DIM,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("[semantic-search] Embed API error:", res.status, err);
    return null;
  }
  const data = await res.json();
  const values = data?.embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBED_DIM) return null;
  return values;
}

export async function POST(request: NextRequest): Promise<NextResponse<SemanticSearchResponse>> {
  try {
    const body = await request.json().catch(() => ({}));
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query) {
      return NextResponse.json({ matches: [], error: "Missing query" }, { status: 400 });
    }

    const apiKey =
      (typeof process.env.GOOGLE_GENERATIVE_AI_API_KEY === "string" &&
        process.env.GOOGLE_GENERATIVE_AI_API_KEY.trim()) ||
      "";
    if (!apiKey) {
      return NextResponse.json(
        { matches: [], error: "Embedding not available (missing GOOGLE_GENERATIVE_AI_API_KEY)" },
        { status: 503 }
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { matches: [], error: "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." },
        { status: 503 }
      );
    }

    const user = await getServerUser();
    const userId = user?.id ?? (await import("@/lib/supabase/server")).FALLBACK_USER_ID_FOR_DEV;

    const vec = await getEmbedding(query, apiKey);
    if (!vec) {
      return NextResponse.json(
        { matches: [], error: "Failed to get embedding from Gemini" },
        { status: 502 }
      );
    }

    const limit = Math.min(20, Math.max(1, Number(body?.limit) || 10));

    const [linkedRes, directRes] = await Promise.all([
      (supabase as any).rpc("match_cures_by_query", {
        query_embedding: vec,
        p_user_id: userId,
        match_limit: limit,
      }),
      (supabase as any).rpc("match_cures_direct", {
        query_embedding: vec,
        p_user_id: userId,
        match_limit: limit,
      }),
    ]);

    const linked = (linkedRes.data ?? []) as Array<{
      cure_id: string;
      cure_content: string;
      cure_content_english: string | null;
      cure_type: string;
      fault_id: string;
      fault_description: string;
      fault_description_english: string | null;
      similarity: number;
    }>;
    const direct = (directRes.data ?? []) as Array<{
      id: string;
      content: string;
      content_english: string | null;
      type: string;
      similarity?: number;
    }>;

    const matchesFromLinked: SemanticSearchMatch[] = linked.map((row) => ({
      cureId: row.cure_id,
      cureContent: row.cure_content,
      cureContentEnglish: row.cure_content_english,
      cureType: row.cure_type,
      faultId: row.fault_id,
      faultDescription: row.fault_description,
      faultDescriptionEnglish: row.fault_description_english,
      similarity: row.similarity,
    }));

    const matchesFromDirect: SemanticSearchMatch[] = (direct ?? []).map((row) => ({
      cureId: row.id,
      cureContent: row.content,
      cureContentEnglish: row.content_english,
      cureType: row.type,
      similarity: typeof row.similarity === "number" ? row.similarity : 1,
    }));

    const combined = [...matchesFromLinked, ...matchesFromDirect]
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return NextResponse.json({ matches: combined });
  } catch (e) {
    console.error("[semantic-search]", e);
    return NextResponse.json(
      { matches: [], error: e instanceof Error ? e.message : "Search failed" },
      { status: 500 }
    );
  }
}
