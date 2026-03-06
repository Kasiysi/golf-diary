"use client";

import { Suspense } from "react";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { EntriesProvider } from "@/lib/entries-context";
import { QuickAddProvider } from "@/lib/quick-add-context";
import { PinnedPlanProvider } from "@/lib/pinned-plan-context";
import { FundamentalsProvider } from "@/lib/fundamentals-context";

function SidebarFallback() {
  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="flex h-14 items-center border-b border-white/10 px-4">
        <span className="font-semibold text-[var(--accent)]">Golf Repository</span>
      </div>
      <div className="p-3 border-b border-white/10 h-[52px]" aria-hidden />
    </aside>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <EntriesProvider>
      <QuickAddProvider>
        <PinnedPlanProvider>
          <FundamentalsProvider>
            <div className="min-h-screen bg-[#1a1a1c] text-[var(--foreground)]">
          <div className="flex min-h-screen">
            <Suspense fallback={<SidebarFallback />}>
              <Sidebar />
            </Suspense>
            <main className="flex-1 pb-20 md:pb-0 md:min-h-screen">
              {children}
            </main>
          </div>
          <BottomNav />
            </div>
          </FundamentalsProvider>
        </PinnedPlanProvider>
      </QuickAddProvider>
    </EntriesProvider>
  );
}
