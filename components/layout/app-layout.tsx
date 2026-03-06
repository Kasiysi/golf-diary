"use client";

import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { EntriesProvider } from "@/lib/entries-context";
import { QuickAddProvider } from "@/lib/quick-add-context";
import { PinnedPlanProvider } from "@/lib/pinned-plan-context";
import { FundamentalsProvider } from "@/lib/fundamentals-context";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <EntriesProvider>
      <QuickAddProvider>
        <PinnedPlanProvider>
          <FundamentalsProvider>
            <div className="min-h-screen bg-[#1a1a1c] text-[var(--foreground)]">
          <div className="flex min-h-screen">
            <Sidebar />
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
