import type { DiaryEntry } from "./types";
import type { PracticePlan } from "./types";

/**
 * Builds the prompt/input from coach advice entries for the AI.
 * Replace the implementation below with a real Gemini (or other) API call.
 */
export async function generatePracticePlan(entries: DiaryEntry[]): Promise<PracticePlan> {
  // TODO: Replace with Gemini API call. Example:
  // const response = await fetch('/api/generate-practice-plan', {
  //   method: 'POST',
  //   body: JSON.stringify({ notes: entries.map(e => e.notes).join('\n') }),
  // });
  // return response.json();

  const notes = entries.map((e) => e.notes).filter(Boolean).join("\n") || "No coach advice notes yet.";

  // Mock: derive a simple plan from the first few notes (replace with Gemini API call)
  const lines = notes.split(/\n/).filter((s) => s.trim());
  const firstLine = lines[0]?.trim() || "Stay consistent with your setup and tempo.";
  const feelListRaw = lines.slice(0, 4).map((s) => s.trim()).filter(Boolean);
  const feelList =
    feelListRaw.length > 0 ? feelListRaw : ["Smooth tempo", "Commit to the shot", "One thought only"];
  const drillPlan = [
    "Warm up with 10 easy swings focusing on " + (firstLine.slice(0, 40) || "tempo") + ".",
    "Hit 5 balls with your main cue in mind.",
    "Add a second cue and hit 5 more.",
    "Finish with 3 full routine rehearsals.",
  ];

  return {
    coreFocus: firstLine.length > 80 ? firstLine.slice(0, 80) + "…" : firstLine,
    feelList,
    drillPlan,
    generatedAt: new Date().toISOString(),
  };
}
