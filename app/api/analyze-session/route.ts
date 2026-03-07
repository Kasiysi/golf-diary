/**
 * POST /api/analyze-session
 *
 * Uses Google Gemini 1.5 Flash for:
 * - Vision: OCR of launch monitor screens (Trackman, GCQuad) → club_path, face_angle, launch_direction
 * - Text: If input is Finnish, generates search_summary_english and tags for the database
 *
 * Body: { imageUrls?: string[], voiceAudioUrl?: string, notes?: string }
 * Requires GOOGLE_GENERATIVE_AI_API_KEY.
 * Categories: Long Game, Short Game, Putting, Coach's Advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const MODEL = "gemini-1.5-flash";

/** Heuristic: likely Finnish if contains Finnish chars or common words */
function isLikelyFinnish(text: string): boolean {
  const t = text.trim();
  if (!t || t.length < 3) return false;
  if (/[\u00C0-\u024F\u1E00-\u1EFF]/.test(t)) return true;
  if (/\b(ja|ei|on|oli|olla|että|kun|miten|putti|lyönti|greeni|bunkkeri)\b/i.test(t)) return true;
  if (t.split(/\s/).some((w) => w.length > 12)) return true;
  return false;
}

export interface AnalyzeSessionImageResult {
  imageUrl: string;
  club_path?: string;
  face_angle?: string;
  launch_direction?: string;
  raw?: string;
  error?: string;
}

export interface AnalyzeSessionVoiceResult {
  transcript: string;
  language: string;
  searchOptimization?: {
    summaryEnglish: string;
    tags: string[];
  };
  error?: string;
}

export interface AnalyzeSessionNotesResult {
  summaryEnglish: string;
  tags?: string[];
  /** AI Coach: best YouTube tutorial link (direct video or search); English content preferred */
  suggestedVideoUrl?: string;
  error?: string;
}

export interface AnalyzeSessionResponse {
  imageResults?: AnalyzeSessionImageResult[];
  voiceResult?: AnalyzeSessionVoiceResult;
  notesResult?: AnalyzeSessionNotesResult;
  error?: string;
}

/** Fetch image from URL and return as base64 + mimeType */
async function fetchImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    const buf = Buffer.from(await blob.arrayBuffer());
    const base64 = buf.toString("base64");
    const mimeType = blob.type || "image/jpeg";
    return { data: base64, mimeType: mimeType.split(";")[0].trim() || "image/jpeg" };
  } catch {
    return null;
  }
}

/** Gemini vision: OCR launch monitor screens (Trackman, GCQuad) for club path and face angle */
async function analyzeImageWithGemini(imageUrl: string): Promise<AnalyzeSessionImageResult> {
  if (!genAI) {
    return { imageUrl, error: "Gemini not configured (missing GOOGLE_GENERATIVE_AI_API_KEY)" };
  }
  try {
    const imageData = await fetchImageAsBase64(imageUrl);
    if (!imageData) {
      return { imageUrl, error: "Could not fetch or encode image" };
    }

    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `You are analyzing a photo of a golf launch monitor screen (e.g. Trackman, GCQuad, Foresight).
Read any visible numbers and labels. Extract and return ONLY a JSON object with these keys (use null if not visible or unclear):
- club_path: string (e.g. "in-to-out", "out-to-in", "neutral", "inside-out", "outside-in")
- face_angle: string (e.g. "open", "closed", "square", or degrees if shown)
- launch_direction: string (e.g. "left", "right", "straight", or exact value from screen)
No other text, no markdown, just the JSON object.`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.data,
        },
      },
    ]);

    const raw = result.response.text?.()?.trim() ?? "";
    let club_path: string | undefined;
    let face_angle: string | undefined;
    let launch_direction: string | undefined;
    try {
      const parsed = JSON.parse(raw.replace(/^```json?\s*|\s*```$/g, "")) as Record<string, string | null>;
      club_path = parsed.club_path ?? undefined;
      face_angle = parsed.face_angle ?? undefined;
      launch_direction = parsed.launch_direction ?? undefined;
    } catch {
      // keep raw if parse fails
    }
    return { imageUrl, club_path, face_angle, launch_direction, raw: raw || undefined };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { imageUrl, error: message };
  }
}

/** Gemini text: Finnish → summary, tags, and AI Coach suggested YouTube link (all categories) */
async function optimizeNotesForSearch(notes: string): Promise<AnalyzeSessionNotesResult> {
  if (!genAI || !notes.trim()) {
    return { summaryEnglish: "", error: "Gemini not configured or empty notes" };
  }
  if (!isLikelyFinnish(notes)) {
    return { summaryEnglish: "" };
  }
  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `You are an AI golf coach. The following is a Finnish golf practice note (Long Game, Short Game, Putting, or Coach's Advice). Do two things:

1) Produce a short English summary and tags for database search.
2) Suggest the best YouTube tutorial for this topic: either a direct video URL (prefer trusted channels like Meandmygolf, TopSpeedGolf, Rick Shiels, or similar) or a YouTube search URL (https://www.youtube.com/results?search_query=...). The suggestion can be in English for better quality. Use a concrete search term (e.g. "golf slice fix", "putting alignment drill").

Return ONLY valid JSON with three keys:
- summaryEnglish: string (2-3 sentence summary in English)
- tags: string[] (short English tags, e.g. ["putting", "alignment", "grip"])
- suggestedVideoUrl: string (one full URL: either https://www.youtube.com/watch?v=... or https://www.youtube.com/results?search_query=...)

Note:\n${notes.trim().slice(0, 2000)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text?.()?.trim() ?? "";
    try {
      const parsed = JSON.parse(text.replace(/^```json?\s*|\s*```$/g, "")) as {
        summaryEnglish?: string;
        tags?: string[];
        suggestedVideoUrl?: string;
      };
      const url =
        typeof parsed.suggestedVideoUrl === "string" && parsed.suggestedVideoUrl.startsWith("http")
          ? parsed.suggestedVideoUrl.trim()
          : undefined;
      return {
        summaryEnglish: parsed.summaryEnglish ?? "",
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        ...(url && { suggestedVideoUrl: url }),
      };
    } catch {
      if (text) return { summaryEnglish: text, tags: [] };
    }
    return { summaryEnglish: "" };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { summaryEnglish: "", error: message };
  }
}

/** Voice: optional path – if voiceAudioUrl provided, we could use Gemini audio later; for now skip or keep minimal */
async function transcribeAndOptimizeForSearch(audioUrl: string): Promise<AnalyzeSessionVoiceResult> {
  // Gemini 1.5 Flash can process audio; for now return a placeholder so the API shape is unchanged.
  // To implement: fetch audio, send as inlineData with mimeType audio/*, ask for transcript + summary/tags if Finnish.
  return {
    transcript: "",
    language: "en",
    error: "Voice input: use notes field for text; audio not yet implemented with Gemini",
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeSessionResponse>> {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let imageUrls: string[] = [];
    let voiceAudioUrl: string | undefined;
    let notesText = "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls : [];
      voiceAudioUrl = typeof body.voiceAudioUrl === "string" ? body.voiceAudioUrl : undefined;
      notesText = typeof body.notes === "string" ? body.notes.trim() : "";
    } else if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const urls = form.get("imageUrls");
      if (typeof urls === "string") imageUrls = urls ? [urls] : [];
      else if (Array.isArray(urls)) imageUrls = urls.filter((u): u is string => typeof u === "string");
      voiceAudioUrl = typeof form.get("voiceAudioUrl") === "string" ? (form.get("voiceAudioUrl") as string) : undefined;
      const n = form.get("notes");
      notesText = typeof n === "string" ? n.trim() : "";
    }

    const imageResults: AnalyzeSessionImageResult[] = [];
    for (const url of imageUrls.slice(0, 5)) {
      const result = await analyzeImageWithGemini(url);
      imageResults.push(result);
    }

    let voiceResult: AnalyzeSessionVoiceResult | undefined;
    if (voiceAudioUrl) {
      voiceResult = await transcribeAndOptimizeForSearch(voiceAudioUrl);
    }

    let notesResult: AnalyzeSessionNotesResult | undefined;
    if (notesText) {
      const res = await optimizeNotesForSearch(notesText);
      if (res.summaryEnglish || res.suggestedVideoUrl) notesResult = res;
    }

    return NextResponse.json({
      ...(imageResults.length > 0 && { imageResults }),
      ...(voiceResult && { voiceResult }),
      ...(notesResult && { notesResult }),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
