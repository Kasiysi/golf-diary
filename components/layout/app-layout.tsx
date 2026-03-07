"use client";

import { Suspense } from "react";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { EntriesProvider } from "@/lib/entries-context";
import { QuickAddProvider } from "@/lib/quick-add-context";
import { FundamentalsProvider } from "@/lib/fundamentals-context";

function SidebarFallback() {
  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-[var(--border)] bg-[var(--card)]">
      <div className="flex h-14 items-center border-b border-[var(--border)] px-4">
        <span className="font-semibold text-[var(--accent)]">Golf Diary</span>
      </div>
      <div className="p-3 border-b border-[var(--border)] h-[52px]" aria-hidden />
    </aside>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <EntriesProvider>
      <QuickAddProvider>
        <FundamentalsProvider>
          <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
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
      </QuickAddProvider>
    </EntriesProvider>
  );
}
