"use client";

import { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";
import { getYouTubeVideoId } from "@/lib/utils";
import { CLUB_CATEGORIES } from "@/lib/constants";

/** One item from cures_feels where is_priority = true */
export interface ChecklistPriorityItem {
  id: string;
  content: string;
  contentEnglish: string | null;
  type: string;
  club: string | null;
  createdAt: string;
  suggestedVideoUrl?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CLUB_CATEGORIES.map((c) => [c.value, c.label])
);

function categoryLabel(club: string | null): string {
  if (!club) return "";
  return CATEGORY_LABELS[club] ?? club;
}

/**
 * Quick-Check (Top 3): fetches from cures_feels table, is_priority = true only.
 * Data from /api/checklist-priorities (Supabase: cures_feels, is_priority column). No separate Checklist table.
 */
export function QuickCheckDashboard() {
  const [items, setItems] = useState<ChecklistPriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPriorities = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/checklist-priorities?limit=3", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { items?: ChecklistPriorityItem[]; error?: string }) => {
        if (data.error) setError(data.error);
        else setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchPriorities();
    const onRefresh = () => {
      if (!cancelled) fetchPriorities();
    };
    const onVisibility = () => {
      if (!cancelled && document.visibilityState === "visible") fetchPriorities();
    };
    window.addEventListener("checklist-priorities-refresh", onRefresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener("checklist-priorities-refresh", onRefresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchPriorities]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow)]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          <Star className="h-4 w-4" />
          Quick-Check (Top 3)
        </div>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Ladataan…</p>
      </div>
    );
  }

  if (error || items.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow)]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          <Star className="h-4 w-4" />
          Quick-Check (Top 3)
        </div>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {error ?? "Ei prioriteetteja. Merkitse tähdellä entry, niin se näkyy tässä."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white overflow-hidden shadow-[var(--shadow)]">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)]">
        <Star className="h-4 w-4 text-[var(--accent)] fill-[var(--accent)]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
          Quick-Check — Top 3 (cures_feels, is_priority = true)
        </span>
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {items.map((item, i) => (
          <li key={item.id} className="px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                #{i + 1}
              </span>
              {item?.club != null && item.club !== "" && (
                <span className="inline-flex rounded-md bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--accent)] uppercase">
                  {categoryLabel(item.club)}
                </span>
              )}
              <span className="text-[10px] text-[var(--muted-foreground)]">{item.type}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--foreground)]">
              {item.contentEnglish ?? item.content}
            </p>
            {item.suggestedVideoUrl && (
              <div className="mt-1.5 rounded-lg border border-[var(--accent)]/15 bg-[var(--accent)]/5 px-2 py-1.5">
                <span className="text-[10px] font-semibold uppercase text-[var(--accent)]">AI suosittelee</span>
                <a
                  href={item.suggestedVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 block text-xs text-[var(--accent)] underline"
                >
                  {getYouTubeVideoId(item.suggestedVideoUrl) ? "Katso harjoitus →" : "Hae YouTubessa →"}
                </a>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
