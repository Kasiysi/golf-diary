"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Crosshair,
  Trees,
  Gauge,
  Target,
  CircleDot,
  Circle,
  MessageSquare,
  Star,
  Layout,
  ArrowUpFromLine,
  ArrowDownFromLine,
  Sparkles,
  Search,
  ListChecks,
} from "lucide-react";
import { CLUB_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PracticePlanTrigger } from "@/components/practice-plan-trigger";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  driver: Crosshair,
  woods: Trees,
  "long-irons": Gauge,
  "short-irons": Target,
  wedges: CircleDot,
  putter: Circle,
  setup: Layout,
  anything: Sparkles,
};

const globalSections = [
  { href: "/priorities", label: "Priorities", icon: Star },
  { href: "/coach-advice", label: "Coach Advice", icon: MessageSquare },
  { href: "/manage-checklist", label: "Manage Checklist", icon: ListChecks },
  { href: "/club/setup", label: "Setup", icon: Layout },
  { href: "/backswing", label: "Backswing", icon: ArrowUpFromLine },
  { href: "/downswing", label: "Downswing", icon: ArrowDownFromLine },
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
    <aside className="hidden md:flex w-56 flex-col border-r border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="flex h-14 items-center border-b border-white/10 px-4">
        <span className="font-semibold text-[var(--accent)]">Golf Repository</span>
      </div>
      <form onSubmit={handleSearch} className="p-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <input
            ref={searchRef}
            name="q"
            type="search"
            key={`search-${pathname}-${qFromUrl}`}
            defaultValue={pathname === "/search" ? qFromUrl : ""}
            placeholder="Search problems, cures…"
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-8 pr-3 text-sm placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            aria-label="Search problems, cures, and coach advice"
          />
        </div>
      </form>
      <nav className="flex-1 space-y-0.5 p-3 overflow-auto">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/"
              ? "bg-[var(--accent)]/20 text-[var(--accent)]"
              : "text-[var(--muted-foreground)] hover:bg-white/10 hover:text-[var(--foreground)]"
          )}
        >
          <BookOpen className="h-5 w-5" />
          Diary
        </Link>

        <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
          Global
        </p>
        <div className="px-1 pb-1">
          <PracticePlanTrigger />
        </div>
        {globalSections.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                : "text-[var(--muted-foreground)] hover:bg-white/10 hover:text-[var(--foreground)]"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}

        <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
          Clubs
        </p>
        {CLUB_CATEGORIES.map(({ value, label }) => {
          const Icon = iconMap[value];
          const href = `/club/${value}`;
          const isActive = pathname === href;
          return (
            <Link
              key={value}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "text-[var(--muted-foreground)] hover:bg-white/10 hover:text-[var(--foreground)]"
              )}
            >
              {Icon && <Icon className="h-5 w-5" />}
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
