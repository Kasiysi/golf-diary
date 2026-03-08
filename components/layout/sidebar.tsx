"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  MessageSquare,
  Star,
  Search,
  ListChecks,
  Crosshair,
  Target,
  Circle,
  MessageCircle,
  Dumbbell,
  Map,
} from "lucide-react";
import { CLUB_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "long-game": Crosshair,
  "short-game": Target,
  putting: Circle,
  "coach-advice": MessageCircle,
};

const nextSessionDrillLink = { href: "/next-session-drill", label: "Next Session Drill", icon: Dumbbell };

const globalSections = [
  { href: "/game-map", label: "Game Map", icon: Map },
  { href: "/priorities", label: "Priorities", icon: Star },
  { href: "/coach-advice", label: "Coach Advice", icon: MessageSquare },
  { href: "/manage-checklist", label: "Manage Checklist", icon: ListChecks },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const qFromUrl = searchParams.get("q") ?? "";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = (e.currentTarget as HTMLFormElement).querySelector<HTMLInputElement>("input[name='q']")?.value?.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
    else router.push("/search");
  };

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-[var(--border)] bg-[var(--card)] shadow-sm">
      <div className="flex h-14 items-center border-b border-[var(--border)] px-4">
        <span className="font-heading font-semibold text-[var(--heading)] text-lg">Golf Diary</span>
      </div>
      <form onSubmit={handleSearch} className="p-3 border-b border-[var(--border)] shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
          <input
            ref={searchRef}
            name="q"
            type="search"
            key={`search-${pathname}-${qFromUrl}`}
            defaultValue={pathname === "/search" ? qFromUrl : ""}
            placeholder="Search (FI/EN)…"
            className="w-full rounded-xl border border-[var(--border)] bg-white py-2 pl-8 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] shadow-[var(--shadow-sm)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
            aria-label="Search problems, cures, coach advice"
          />
        </div>
      </form>
      <nav className="flex-1 space-y-0.5 p-3 overflow-auto min-h-0">
        <Link
          href="/diary"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/diary"
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
        <Link
          href={nextSessionDrillLink.href}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors border border-transparent",
            pathname === nextSessionDrillLink.href
              ? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/30"
              : "text-[var(--foreground)] hover:bg-[var(--muted)] border-transparent"
          )}
        >
          <Dumbbell className="h-5 w-5 shrink-0" />
          {nextSessionDrillLink.label}
        </Link>
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
