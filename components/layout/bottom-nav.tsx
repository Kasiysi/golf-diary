"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Crosshair,
  Trees,
  Gauge,
  Target,
  CircleDot,
  Circle,
  Layout,
  MessageSquare,
  Star,
  Sparkles,
} from "lucide-react";
import { CLUB_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

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

const mobileNavItems = [
  { href: "/", label: "Diary", icon: BookOpen },
  { href: "/coach-advice", label: "Coach", icon: MessageSquare },
  { href: "/priorities", label: "Priority", icon: Star },
  { href: "/club/setup", label: "Setup", icon: Layout },
  ...CLUB_CATEGORIES.filter((c) => c.value !== "setup").map((c) => ({
    href: `/club/${c.value}`,
    label: c.label,
    icon: iconMap[c.value],
  })),
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/10 bg-white/5 backdrop-blur-xl py-2 md:hidden safe-area-pb">
      {mobileNavItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "text-[var(--accent)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
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
