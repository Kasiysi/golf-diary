"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFundamentals } from "@/lib/fundamentals-context";

const STORAGE_KEY_OPEN = "golf-repo-fundamentals-open";

export function FundamentalsChecklist() {
  const { items, checkedIds, toggleChecked, resetToday } = useFundamentals();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_OPEN);
      if (stored !== null) setOpen(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_OPEN, JSON.stringify(open));
    } catch {
      // ignore
    }
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white shadow-[var(--shadow-sm)] overflow-hidden">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
          aria-expanded={open}
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">
            Fundamentals
          </span>
          {open ? (
            <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
          ) : (
            <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />
          )}
        </button>
        {open && checkedIds.length > 0 && (
          <button
            type="button"
            onClick={resetToday}
            className="px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            Reset
          </button>
        )}
      </div>
      {open && (
        <ul className="border-t border-[var(--border)] px-4 py-3 space-y-3">
          {items.map((item) => {
            const checked = checkedIds.includes(item.id);
            return (
              <li key={item.id}>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <span
                    role="checkbox"
                    aria-checked={checked}
                    tabIndex={0}
                    onClick={() => toggleChecked(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleChecked(item.id);
                      }
                    }}
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors mt-0.5",
                      checked
                        ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--accent-foreground)]"
                        : "border-white/20 group-hover:border-white/40"
                    )}
                  >
                    {checked ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "text-sm block",
                        checked ? "text-[var(--muted-foreground)] line-through opacity-80" : "text-[var(--foreground)]"
                      )}
                    >
                      {item.title}
                    </span>
                    {item.why && (
                      <span
                        className={cn(
                          "text-xs block mt-0.5",
                          checked ? "text-[var(--muted-foreground)] opacity-60 line-through" : "text-[var(--muted-foreground)]"
                        )}
                      >
                        {item.why}
                      </span>
                    )}
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
