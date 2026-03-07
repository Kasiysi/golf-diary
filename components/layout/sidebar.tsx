"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  MessageSquare,
  Star,
  ListChecks,
  Crosshair,
  Target,
  Circle,
  MessageCircle,
} from "lucide-react";
import { CLUB_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "long-game": Crosshair,
  "short-game": Target,
  putting: Circle,
  "coach-advice": MessageCircle,
};

const globalSections = [
  { href: "/priorities", label: "Priorities", icon: Star },
  { href: "/coach-advice", label: "Coach Advice", icon: MessageSquare },
  { href: "/manage-checklist", label: "Manage Checklist", icon: ListChecks },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-[var(--border)] bg-[var(--card)] shadow-sm">
      <div className="flex h-14 items-center border-b border-[var(--border)] px-4">
        <span className="font-semibold text-[var(--accent)]">Golf Diary</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-3 overflow-auto">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/"
              ? "bg-[var(--accent)]/10 text-[var(--accent)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          )}
        >
          <BookOpen className="h-5 w-5" />
          Diary
        </Link>

        <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
          Categories
        </p>
        {CLUB_CATEGORIES.map(({ value, label }) => {
          const Icon = categoryIconMap[value];
          const href = `/club/${value}`;
          const isActive = pathname === href;
          return (
            <Link
              key={value}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors border border-transparent",
                isActive
                  ? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30"
                  : "text-[var(--foreground)] hover:bg-[var(--muted)] border-transparent"
              )}
            >
              {Icon && <Icon className="h-5 w-5 shrink-0" />}
              {label}
            </Link>
          );
        })}

        <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
          Global
        </p>
        {globalSections.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
