export interface FundamentalsItem {
  id: string;
  title: string;
  why: string;
}

const ITEMS_KEY = "golf-repo-fundamentals-items";
const COMPLETION_KEY = "golf-repo-fundamentals-completion";

function getDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadItems(): FundamentalsItem[] {
  if (typeof window === "undefined") return getDefaultItems();
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (!raw) return getDefaultItems();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getDefaultItems();
  } catch {
    return getDefaultItems();
  }
}

function getDefaultItems(): FundamentalsItem[] {
  return [
    { id: crypto.randomUUID(), title: "Grip – neutral, no tension", why: "Consistent grip prevents unwanted face rotation." },
    { id: crypto.randomUUID(), title: "Stance – shoulder-width, athletic", why: "Stable base for rotation and balance." },
    { id: crypto.randomUUID(), title: "Alignment – clubface then body", why: "Aim determines start line and path." },
    { id: crypto.randomUUID(), title: "Ball position – consistent for club", why: "Affects strike and trajectory." },
    { id: crypto.randomUUID(), title: "Tempo – smooth takeaway, accelerate through", why: "Timing over speed for consistency." },
    { id: crypto.randomUUID(), title: "Follow-through – full and balanced", why: "Result of a good strike; reinforces finish." },
  ];
}

function saveItems(items: FundamentalsItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}

type CompletionState = { dateKey: string; checkedIds: string[] };

function loadCompletion(): CompletionState {
  if (typeof window === "undefined") return { dateKey: getDateKey(), checkedIds: [] };
  try {
    const raw = localStorage.getItem(COMPLETION_KEY);
    const today = getDateKey();
    if (!raw) return { dateKey: today, checkedIds: [] };
    const parsed = JSON.parse(raw) as CompletionState;
    if (parsed.dateKey !== today) {
      const newState: CompletionState = { dateKey: today, checkedIds: [] };
      saveCompletion(newState);
      return newState;
    }
    return { dateKey: parsed.dateKey, checkedIds: Array.isArray(parsed.checkedIds) ? parsed.checkedIds : [] };
  } catch {
    return { dateKey: getDateKey(), checkedIds: [] };
  }
}

function saveCompletion(state: CompletionState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMPLETION_KEY, JSON.stringify(state));
}

export function getFundamentalsItems(): FundamentalsItem[] {
  return loadItems();
}

export function addFundamentalsItem(item: Omit<FundamentalsItem, "id">): FundamentalsItem {
  const items = loadItems();
  const newItem: FundamentalsItem = { ...item, id: crypto.randomUUID() };
  items.push(newItem);
  saveItems(items);
  return newItem;
}

export function updateFundamentalsItem(id: string, updates: Partial<Omit<FundamentalsItem, "id">>): FundamentalsItem | null {
  const items = loadItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates, id: items[idx].id };
  saveItems(items);
  return items[idx];
}

export function deleteFundamentalsItem(id: string): boolean {
  const items = loadItems();
  const next = items.filter((i) => i.id !== id);
  if (next.length === items.length) return false;
  saveItems(next);
  return true;
}

export function getCheckedIdsToday(): string[] {
  return loadCompletion().checkedIds;
}

export function setItemChecked(id: string, checked: boolean): void {
  const state = loadCompletion();
  const today = getDateKey();
  if (state.dateKey !== today) state.checkedIds = [];
  state.dateKey = today;
  const set = new Set(state.checkedIds);
  if (checked) set.add(id);
  else set.delete(id);
  state.checkedIds = Array.from(set);
  saveCompletion(state);
}

export function resetTodayChecks(): void {
  saveCompletion({ dateKey: getDateKey(), checkedIds: [] });
}
