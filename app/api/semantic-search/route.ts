/**
 * POST /api/semantic-search
 *
 * Vector search: embed query with Gemini embedding-001 (embedContent API), then match via Supabase RPC.
 * Uses REST models/embedding-001:embedContent (same as model.embedContent(query); @google/generative-ai has no embed API).
 * GOOGLE_GENERATIVE_AI_API_KEY; outputDimensionality 1536. Errors from Gemini are returned in JSON for client (e.g. iPhone).
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

/** Result: either embedding vector or error message from Gemini (for client display). */
type EmbeddingResult = { ok: true; values: number[] } | { ok: false; error: string };

/**
 * Get embedding via Gemini embedContent API (embedding-001).
 * Uses REST models/embedding-001:embedContent; apiKey read inside request handler.
 * outputDimensionality 1536 to match Supabase vector columns.
 */
async function getEmbedding(
  text: string,
  apiKey: string,
  model: string = "embedding-001"
): Promise<EmbeddingResult> {
  if (!apiKey || !text.trim()) {
    return { ok: false, error: "GOOGLE_GENERATIVE_AI_API_KEY is missing or empty." };
  }

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

    const rawBody = await res.text();

    if (!res.ok) {
      let geminiMessage = rawBody;
      try {
        const parsed = JSON.parse(rawBody) as { error?: { message?: string; status?: string } };
        geminiMessage = parsed?.error?.message ?? parsed?.error?.status ?? rawBody;
      } catch {
        // use rawBody as-is
      }
      console.error("[semantic-search] Gemini embedContent error:", res.status, geminiMessage);
      return {
        ok: false,
        error: `Gemini embedding error (${res.status}): ${geminiMessage}`,
      };
    }

    const data = JSON.parse(rawBody) as { embedding?: { values?: number[] } };
    const vec = data.embedding?.values;
    if (!vec || !Array.isArray(vec) || vec.length !== EMBEDDING_DIMENSION) {
      const msg = "Invalid embedding response shape or dimension.";
      console.error("[semantic-search]", msg, "length:", vec?.length);
      return { ok: false, error: msg };
    }
    return { ok: true, values: vec };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Gemini error details:", err);
    return {
      ok: false,
      error: `Embedding request failed: ${err.message}`,
    };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<SemanticSearchResponse>> {
  try {
    // Initialize env only inside POST so process.env is loaded in serverless
    const geminiKeyRaw = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const apiKey = typeof geminiKeyRaw === "string" ? geminiKeyRaw.trim() : "";
    const model = "embedding-001";

    const body = await request.json().catch(() => ({}));
    const q = typeof body.q === "string" ? body.q.trim() : "";
    const limit = typeof body.limit === "number" ? Math.min(20, Math.max(1, body.limit)) : 5;

    if (!q) {
      return NextResponse.json({ matches: [], source: "none" });
    }

    // embedContent(query) via REST (embedding-001); SDK has no embed API
    const embedResult = await getEmbedding(q, apiKey, model);

    if (!embedResult.ok) {
      return NextResponse.json({
        matches: [],
        source: "none",
        error: embedResult.error,
      });
    }
    const embedding = embedResult.values;

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
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Gemini error details:", err);
    return NextResponse.json(
      { matches: [], source: "none", error: err.message },
      { status: 500 }
    );
  }
}
