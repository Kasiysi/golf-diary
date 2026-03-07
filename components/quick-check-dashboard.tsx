"use client";

import { useState, useEffect, useCallback } from "react";
import { ListChecks } from "lucide-react";
import { getYouTubeVideoId } from "@/lib/utils";

export interface ChecklistPriorityItem {
  id: string;
  content: string;
  contentEnglish: string | null;
  type: string;
  createdAt: string;
  suggestedVideoUrl?: string | null;
}

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
    const onVisibilityChange = () => {
      if (!cancelled && document.visibilityState === "visible") fetchPriorities();
    };
    window.addEventListener("checklist-priorities-refresh", onRefresh);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      window.removeEventListener("checklist-priorities-refresh", onRefresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchPriorities]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          <ListChecks className="h-4 w-4" />
          Quick-Check (Top 3)
        </div>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Loading…</p>
      </div>
    );
  }

  if (error || items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          <ListChecks className="h-4 w-4" />
          Quick-Check (Top 3)
        </div>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {error ?? "No priorities set. Star an entry to pin it here."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
        <ListChecks className="h-4 w-4 text-[var(--accent)]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
          Quick-Check — Top 3 Pinned Cures
        </span>
      </div>
      <ul className="divide-y divide-white/10">
        {items.map((item, i) => (
          <li key={item.id} className="px-4 py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              #{i + 1} · {item.type}
            </span>
            <p className="mt-0.5 text-sm text-[var(--foreground)]">
              {item.contentEnglish ?? item.content}
            </p>
            {item.suggestedVideoUrl && (
              <div className="mt-1.5 rounded-lg border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-2 py-1.5">
                <span className="text-[10px] font-semibold uppercase text-[var(--accent)]">AI suosittelee</span>
                {getYouTubeVideoId(item.suggestedVideoUrl) ? (
                  <a
                    href={item.suggestedVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block text-xs text-[var(--accent)] underline"
                  >
                    Katso harjoitus →
                  </a>
                ) : (
                  <a
                    href={item.suggestedVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block text-xs text-[var(--accent)] underline"
                  >
                    Hae harjoituksia YouTubessa →
                  </a>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
