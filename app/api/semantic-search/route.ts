/**
 * POST /api/semantic-search
 *
 * Vector search: embed query (e.g. "Draiveri slaissaa tänään") and return linked Cures (e.g. "Stronger Grip").
 * Uses Supabase RPC match_cures_by_query + match_cures_direct when Supabase and OpenAI are configured.
 * Body: { q: string, limit?: number }
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getSupabaseServer, getServerUser } from "@/lib/supabase/server";
import { EMBEDDING_DIMENSION } from "@/lib/db/schema";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

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

async function getEmbedding(text: string): Promise<number[] | null> {
  if (!openai || !text.trim()) return null;
  const resp = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.trim().slice(0, 8000),
  });
  const vec = resp.data?.[0]?.embedding;
  if (!vec || vec.length !== EMBEDDING_DIMENSION) return null;
  return vec;
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
        error: "Embedding not available (missing OPENAI_API_KEY or invalid response)",
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
