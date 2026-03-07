/**
 * POST /api/analyze-session
 *
 * Multi-modal AI: vision OCR (club path, face angle, launch direction) + voice (Whisper + optional Finnish → English search optimization).
 * Body: { imageUrls?: string[], voiceAudioUrl?: string } or formData with files.
 * Requires OPENAI_API_KEY. Optional: NEXT_PUBLIC_SUPABASE_URL for storage URLs.
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const VISION_MODEL = "gpt-4o-mini";

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

export interface AnalyzeSessionResponse {
  imageResults?: AnalyzeSessionImageResult[];
  voiceResult?: AnalyzeSessionVoiceResult;
  error?: string;
}

async function analyzeImageWithVision(imageUrl: string): Promise<AnalyzeSessionImageResult> {
  if (!openai) {
    return { imageUrl, error: "OpenAI not configured" };
  }
  try {
    const resp = await openai.chat.completions.create({
      model: VISION_MODEL,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a golf swing analyst. Look at this golf swing image (e.g. club path, face, launch).
Return ONLY a JSON object with these keys (use null if unclear):
- club_path: string (e.g. "in-to-out", "out-to-in", "neutral")
- face_angle: string (e.g. "open", "closed", "square")
- launch_direction: string (e.g. "left", "right", "straight")
No other text.`,
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    });
    const raw = resp.choices[0]?.message?.content?.trim() ?? "";
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

async function transcribeAndOptimizeForSearch(audioUrl: string): Promise<AnalyzeSessionVoiceResult> {
  if (!openai) {
    return { transcript: "", language: "en", error: "OpenAI not configured" };
  }
  try {
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      return { transcript: "", language: "en", error: `Failed to fetch audio: ${audioResponse.status}` };
    }
    const blob = await audioResponse.blob();
    const file = new File([blob], "voice.mp3", { type: blob.type || "audio/mpeg" });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "verbose_json",
      language: undefined,
    });

    const transcript = (transcription as { text?: string }).text ?? "";
    const language = (transcription as { language?: string }).language ?? "en";

    let searchOptimization: AnalyzeSessionVoiceResult["searchOptimization"] | undefined;
    const isLikelyFinnish = language === "fi" || /[\u00C0-\u024F\u1E00-\u1EFF]/.test(transcript) || transcript.split(/\s/).some((w) => w.length > 10);
    if (transcript && (isLikelyFinnish || language === "fi")) {
      const comp = await openai.chat.completions.create({
        model: VISION_MODEL,
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `The following is a Finnish golf practice note (transcription). Produce a "Search Optimization" block so we can find this note using English semantic search.
Return ONLY valid JSON with two keys:
- summaryEnglish: string (2-3 sentence summary in English)
- tags: string[] (short English tags, e.g. ["driver", "slice", "grip"])
Transcription:\n${transcript}`,
          },
        ],
      });
      const text = comp.choices[0]?.message?.content?.trim() ?? "";
      try {
        const parsed = JSON.parse(text.replace(/^```json?\s*|\s*```$/g, "")) as { summaryEnglish?: string; tags?: string[] };
        if (parsed.summaryEnglish) {
          searchOptimization = {
            summaryEnglish: parsed.summaryEnglish,
            tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          };
        }
      } catch {
        if (text) searchOptimization = { summaryEnglish: text, tags: [] };
      }
    }

    return {
      transcript,
      language,
      searchOptimization,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { transcript: "", language: "en", error: message };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeSessionResponse>> {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let imageUrls: string[] = [];
    let voiceAudioUrl: string | undefined;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls : [];
      voiceAudioUrl = typeof body.voiceAudioUrl === "string" ? body.voiceAudioUrl : undefined;
    } else if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const urls = form.get("imageUrls");
      if (typeof urls === "string") imageUrls = urls ? [urls] : [];
      else if (Array.isArray(urls)) imageUrls = urls.filter((u): u is string => typeof u === "string");
      voiceAudioUrl = typeof form.get("voiceAudioUrl") === "string" ? (form.get("voiceAudioUrl") as string) : undefined;
    }

    const imageResults: AnalyzeSessionImageResult[] = [];
    for (const url of imageUrls.slice(0, 5)) {
      const result = await analyzeImageWithVision(url);
      imageResults.push(result);
    }

    let voiceResult: AnalyzeSessionVoiceResult | undefined;
    if (voiceAudioUrl) {
      voiceResult = await transcribeAndOptimizeForSearch(voiceAudioUrl);
    }

    return NextResponse.json({
      ...(imageResults.length > 0 && { imageResults }),
      ...(voiceResult && { voiceResult }),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
