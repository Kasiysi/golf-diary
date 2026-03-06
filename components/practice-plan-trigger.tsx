"use client";

import { useState, useCallback } from "react";
import { useEntries } from "@/lib/entries-context";
import { generatePracticePlan } from "@/lib/practice-plan-api";
import { PracticePlanModal } from "@/components/practice-plan-modal";
import type { PracticePlan } from "@/lib/types";
import type { DiaryEntry } from "@/lib/types";
import { Sparkles } from "lucide-react";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function getCoachAdviceFromLast30Days(entries: DiaryEntry[]): DiaryEntry[] {
  const cutoff = Date.now() - THIRTY_DAYS_MS;
  return entries.filter(
    (e) => e.entryType === "coach-advice" && new Date(e.createdAt).getTime() >= cutoff
  );
}

export function PracticePlanTrigger() {
  const entries = useEntries();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<PracticePlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setOpen(true);
    setPlan(null);
    const coachEntries = getCoachAdviceFromLast30Days(entries);
    setIsLoading(true);
    try {
      const result = await generatePracticePlan(coachEntries);
      setPlan(result);
    } catch (err) {
      console.error("Practice plan generation failed:", err);
      setPlan({
        coreFocus: "Unable to generate. Add Coach Advice entries from the last 30 days, or check your API.",
        feelList: [],
        drillPlan: [],
        generatedAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [entries]);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
      >
        <Sparkles className="h-5 w-5" />
        Generate Practice Plan
      </button>
      <PracticePlanModal open={open} onOpenChange={setOpen} plan={plan} isLoading={isLoading} />
    </>
  );
}
