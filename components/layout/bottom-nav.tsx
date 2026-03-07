"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Crosshair,
  Target,
  Circle,
  MessageCircle,
  MessageSquare,
  Star,
} from "lucide-react";
import { CLUB_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "long-game": Crosshair,
  "short-game": Target,
  putting: Circle,
  "coach-advice": MessageCircle,
};

const mobileNavItems = [
  { href: "/diary", label: "Diary", icon: BookOpen },
  ...CLUB_CATEGORIES.map((c) => ({
    href: `/club/${c.value}`,
    label: c.label,
    icon: iconMap[c.value],
  })),
  { href: "/coach-advice", label: "Coach", icon: MessageSquare },
  { href: "/priorities", label: "Priority", icon: Star },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-[var(--border)] bg-[var(--card)] shadow-[0_-1px_3px_0_rgb(0_0_0/0.08)] py-2 md:hidden safe-area-pb">
      {mobileNavItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-2 py-2 min-w-[4rem] text-xs font-medium transition-colors border border-transparent",
              isActive
                ? "text-[var(--accent)] border-[var(--accent)]/30 bg-[var(--accent)]/10"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="max-w-[4rem] truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
