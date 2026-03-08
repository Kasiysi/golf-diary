import type { ClubCategory, EntryType, SwingPhase } from "./types";

/** Four primary categories: lean UI, easy to tap with gloves */
export const CLUB_CATEGORIES: { value: ClubCategory; label: string }[] = [
  { value: "long-game", label: "Long Game" },
  { value: "short-game", label: "Short Game" },
  { value: "putting", label: "Putting" },
  { value: "coach-advice", label: "Coach's Advice" },
];

export const SWING_PHASES: { value: SwingPhase; label: string }[] = [
  { value: "none", label: "None" },
  { value: "setup", label: "Setup" },
  { value: "backswing", label: "Backswing" },
  { value: "downswing", label: "Downswing" },
];

export const ENTRY_TYPES: { value: EntryType; label: string }[] = [
  { value: "feel", label: "Feel" },
  { value: "problem", label: "Problem" },
  { value: "drill", label: "Drill" },
  { value: "coach-advice", label: "Coach's Advice" },
];

export const NAV_ITEMS = [
  { href: "/", label: "Diary", icon: "BookOpen" },
  { href: "/next-session-drill", label: "Next Session Drill", slug: "next-session-drill" },
  ...CLUB_CATEGORIES.map((c) => ({
    href: `/club/${c.value}`,
    label: c.label,
    slug: c.value,
  })),
];
