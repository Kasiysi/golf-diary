"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { PracticePlan } from "./types";

const STORAGE_KEY = "golf-repo-pinned-practice-plan";

type PinnedPlanContextValue = {
  pinnedPlan: PracticePlan | null;
  setPinnedPlan: (plan: PracticePlan | null) => void;
};

const PinnedPlanContext = createContext<PinnedPlanContextValue | null>(null);

function loadPinnedPlan(): PracticePlan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePinnedPlan(plan: PracticePlan | null) {
  if (typeof window === "undefined") return;
  if (plan) localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  else localStorage.removeItem(STORAGE_KEY);
}

export function PinnedPlanProvider({ children }: { children: React.ReactNode }) {
  const [pinnedPlan, setState] = useState<PracticePlan | null>(null);

  useEffect(() => {
    setState(loadPinnedPlan());
  }, []);

  const setPinnedPlan = useCallback((plan: PracticePlan | null) => {
    savePinnedPlan(plan);
    setState(plan);
  }, []);

  return (
    <PinnedPlanContext.Provider value={{ pinnedPlan, setPinnedPlan }}>
      {children}
    </PinnedPlanContext.Provider>
  );
}

export function usePinnedPlan() {
  const ctx = useContext(PinnedPlanContext);
  return ctx ?? { pinnedPlan: null, setPinnedPlan: () => {} };
}
