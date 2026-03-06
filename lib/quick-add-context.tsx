"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { DiaryEntry } from "./types";
import { QuickAddDialog } from "@/components/quick-add-dialog";

type OpenQuickAddFn = (entry?: DiaryEntry) => void;

const QuickAddContext = createContext<OpenQuickAddFn | null>(null);

export function QuickAddProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);

  const openQuickAdd = useCallback<OpenQuickAddFn>((entry) => {
    setEditingEntry(entry ?? null);
    setOpen(true);
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setEditingEntry(null);
  }, []);

  return (
    <QuickAddContext.Provider value={openQuickAdd}>
      {children}
      <QuickAddDialog
        open={open}
        onOpenChange={handleOpenChange}
        initialEntry={editingEntry ?? undefined}
      />
    </QuickAddContext.Provider>
  );
}

export function useOpenQuickAdd() {
  const ctx = useContext(QuickAddContext);
  return ctx ?? (() => {});
}
