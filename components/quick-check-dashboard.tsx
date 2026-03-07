"use client";

import { useState, useEffect } from "react";
import { ListChecks } from "lucide-react";

export interface ChecklistPriorityItem {
  id: string;
  content: string;
  contentEnglish: string | null;
  type: string;
  createdAt: string;
}

export function QuickCheckDashboard() {
  const [items, setItems] = useState<ChecklistPriorityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/checklist-priorities?limit=3")
      .then((res) => res.json())
      .then((data: { items?: ChecklistPriorityItem[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) setError(data.error);
        else setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
          {error ?? "No priorities set. Mark cures as priority in Manage Checklist to see them here."}
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
          </li>
        ))}
      </ul>
    </div>
  );
}
