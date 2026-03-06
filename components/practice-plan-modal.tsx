"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePinnedPlan } from "@/lib/pinned-plan-context";
import type { PracticePlan } from "@/lib/types";
import { Pin, Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PracticePlan | null;
  isLoading: boolean;
};

export function PracticePlanModal({ open, onOpenChange, plan, isLoading }: Props) {
  const { setPinnedPlan } = usePinnedPlan();

  const handlePin = () => {
    if (plan) {
      setPinnedPlan(plan);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border border-white/10 bg-white/5 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-[var(--accent)]">Practice Plan</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-[var(--accent)]" />
            <p className="text-sm text-[var(--muted-foreground)]">Generating your plan…</p>
          </div>
        ) : plan ? (
          <div className="space-y-5">
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
                Core Focus
              </h3>
              <p className="text-sm text-[var(--foreground)]">{plan.coreFocus}</p>
            </section>
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
                The Feel List
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-[var(--foreground)]">
                {plan.feelList.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-2">
                The Drill Plan
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--foreground)]">
                {plan.drillPlan.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </section>
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {plan && (
            <Button onClick={handlePin} className="gap-2">
              <Pin className="h-4 w-4" />
              Pin to Priorities
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
