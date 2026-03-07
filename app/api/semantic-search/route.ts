/**
 * POST /api/semantic-search
 *
 * Vector search: embed query with Gemini text-embedding-004, then match via Supabase RPC.
 * Uses GOOGLE_GENERATIVE_AI_API_KEY; model text-embedding-004 (same as Pro setup / existing DB entries).
 * outputDimensionality 1536. When not logged in, uses FALLBACK_USER_ID_FOR_DEV for testing.
 * Body: { q: string, limit?: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, getServerUser, FALLBACK_USER_ID_FOR_DEV } from "@/lib/supabase/server";
import { EMBEDDING_DIMENSION } from "@/lib/db/schema";

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
  source: "linked" | "direct" | "none";
  error?: string;
}

/**
 * Get embedding vector from Google Generative AI (text-embedding-004).
 * apiKey and model are passed in so env is read inside the request handler.
 * outputDimensionality 1536 to match existing Supabase vector columns.
 */
async function getEmbedding(
  text: string,
  apiKey: string,
  model: string = "text-embedding-004"
): Promise<number[] | null> {
  if (!apiKey || !text.trim()) return null;

  const input = text.trim().slice(0, 8000);
  const apiBase = "https://generativelanguage.googleapis.com/v1beta";
  const url = `${apiBase}/models/${model}:embedContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: {
          parts: [{ text: input }],
        },
        outputDimensionality: EMBEDDING_DIMENSION,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[semantic-search] Embed API error:", res.status, err);
      return null;
    }

    const data = (await res.json()) as { embedding?: { values?: number[] } };
    const vec = data.embedding?.values;
    if (!vec || !Array.isArray(vec) || vec.length !== EMBEDDING_DIMENSION) {
      return null;
    }
    return vec;
  } catch (e) {
    console.error("[semantic-search] getEmbedding failed:", e);
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<SemanticSearchResponse>> {
  try {
    // Log env at the very start so Vercel logs show what's visible (no secret values)
    const geminiKeyRaw = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    console.log("Gemini Key length:", geminiKeyRaw?.length ?? "undefined");
    const envSnapshot: Record<string, string> = {
      GOOGLE_GENERATIVE_AI_API_KEY: geminiKeyRaw ? `set (length ${geminiKeyRaw.length})` : "missing",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "missing",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "missing",
    };
    console.log("[semantic-search] Env snapshot:", JSON.stringify(envSnapshot));

    const body = await request.json().catch(() => ({}));
    const q = typeof body.q === "string" ? body.q.trim() : "";
    const limit = typeof body.limit === "number" ? Math.min(20, Math.max(1, body.limit)) : 5;

    if (!q) {
      return NextResponse.json({ matches: [], source: "none" });
    }

    // All env read inside POST (no top-level init) so process.env is fully loaded in serverless
    const apiKey = typeof geminiKeyRaw === "string" ? geminiKeyRaw.trim() : "";
    const model = "text-embedding-004";
    const embedding = await getEmbedding(q, apiKey, model);

    if (!embedding) {
      const envHelp = Object.entries(envSnapshot)
        .map(([k, v]) => `${k}: ${v}`)
        .join("; ");
      return NextResponse.json({
        matches: [],
        source: "none",
        error: `Embedding not available. Check env in Vercel: ${envHelp}. Set GOOGLE_GENERATIVE_AI_API_KEY in Project Settings → Environment Variables and redeploy.`,
      });
    }

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({
        matches: [],
        source: "none",
        error:
          "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (or SUPABASE_URL and SUPABASE_ANON_KEY).",
      });
    }

    const user = await getServerUser();
    // Temporary: use fallback user ID when not logged in so you can test search on device
    const userId = user?.id ?? FALLBACK_USER_ID_FOR_DEV;

    type LinkedRow = {
      cure_id: string;
      cure_content: string;
      cure_content_english: string | null;
      cure_type: string;
      fault_id: string;
      fault_description: string;
      fault_description_english: string | null;
      similarity: number;
    };
    type DirectRow = {
      id: string;
      content: string;
      content_english: string | null;
      type: string;
      is_priority: boolean;
      similarity: number;
    };

    const linkedResult = await supabase.rpc("match_cures_by_query", {
      query_embedding: embedding,
      p_user_id: userId,
      match_limit: limit,
    } as never);
    const linked = (linkedResult.data ?? null) as LinkedRow[] | null;
    const linkedError = linkedResult.error;

    if (linkedError || !linked?.length) {
      const directResult = await supabase.rpc("match_cures_direct", {
        query_embedding: embedding,
        p_user_id: userId,
        match_limit: limit,
      } as never);
      const direct = (directResult.data ?? null) as DirectRow[] | null;
      const directError = directResult.error;
      if (directError) {
        return NextResponse.json({
          matches: [],
          source: "none",
          error: directError.message ?? "RPC failed",
        });
      }
      const matches: SemanticSearchMatch[] = (direct ?? []).map((row) => ({
        cureId: row.id,
        cureContent: row.content,
        cureContentEnglish: row.content_english,
        cureType: row.type,
        similarity: row.similarity,
      }));
      return NextResponse.json({ matches, source: "direct" });
    }

    const matches: SemanticSearchMatch[] = (linked ?? []).map((row) => ({
      cureId: row.cure_id,
      cureContent: row.cure_content,
      cureContentEnglish: row.cure_content_english,
      cureType: row.cure_type,
      faultId: row.fault_id,
      faultDescription: row.fault_description,
      faultDescriptionEnglish: row.fault_description_english,
      similarity: row.similarity,
    }));

    return NextResponse.json({ matches, source: "linked" });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ matches: [], source: "none", error: message }, { status: 500 });
  }
}
