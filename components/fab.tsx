"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function FAB({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Quick add entry"
      className={cn(
        "fixed z-30 flex items-center justify-center rounded-full shadow-lg",
        "bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 active:scale-95 transition-transform",
        "h-16 w-16 min-[480px]:h-[72px] min-[480px]:w-[72px]",
        "bottom-[max(6rem,calc(1.5rem+env(safe-area-inset-bottom)))] right-[max(1rem,env(safe-area-inset-right))] md:bottom-10 md:right-8",
        className
      )}
    >
      <Plus className="h-8 w-8 min-[480px]:h-9 min-[480px]:w-9" />
    </button>
  );
}
