/**
 * POST /api/semantic-search
 *
 * Vector search: embed query (e.g. "putti ei kulje") and return linked Cures.
 * Uses Google Gemini embedding model for embeddings (GOOGLE_GENERATIVE_AI_API_KEY).
 * Model: gemini-embedding-001 with outputDimensionality 1536.
 * Supabase RPC: match_cures_by_query + match_cures_direct.
 * Body: { q: string, limit?: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, getServerUser } from "@/lib/supabase/server";
import { EMBEDDING_DIMENSION } from "@/lib/db/schema";

// Use gemini-embedding-001 (text-embedding-004 not available on Google AI Studio; this model supports outputDimensionality 1536)
const EMBED_MODEL = "gemini-embedding-001";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

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
 * Requests outputDimensionality 1536 to match existing Supabase vector columns.
 */
async function getEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey || !text.trim()) return null;

  const input = text.trim().slice(0, 8000);
  const url = `${API_BASE}/models/${EMBED_MODEL}:embedContent?key=${encodeURIComponent(apiKey)}`;

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
    const body = await request.json().catch(() => ({}));
    const q = typeof body.q === "string" ? body.q.trim() : "";
    const limit = typeof body.limit === "number" ? Math.min(20, Math.max(1, body.limit)) : 5;

    if (!q) {
      return NextResponse.json({ matches: [], source: "none" });
    }

    const embedding = await getEmbedding(q);
    if (!embedding) {
      return NextResponse.json({
        matches: [],
        source: "none",
        error:
          "Embedding not available (missing GOOGLE_GENERATIVE_AI_API_KEY or invalid response from embedding API)",
      });
    }

    const supabase = getSupabaseServer();
    const user = await getServerUser();

    if (!supabase) {
      return NextResponse.json({
        matches: [],
        source: "none",
        error: "Supabase not configured",
      });
    }

    const userId = user?.id;
    if (!userId) {
      return NextResponse.json({
        matches: [],
        source: "none",
        error: "Not authenticated",
      });
    }

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
