import type { ClubCategory, EntryType, SwingPhase } from "./types";

export const CLUB_CATEGORIES: { value: ClubCategory; label: string }[] = [
  { value: "driver", label: "Driver" },
  { value: "woods", label: "Woods" },
  { value: "long-irons", label: "Long Irons" },
  { value: "short-irons", label: "Short Irons" },
  { value: "wedges", label: "Wedges" },
  { value: "putter", label: "Putter" },
  { value: "setup", label: "Setup" },
  { value: "anything", label: "Anything" },
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
  ...CLUB_CATEGORIES.map((c) => ({
    href: `/club/${c.value}`,
    label: c.label,
    slug: c.value,
  })),
];
