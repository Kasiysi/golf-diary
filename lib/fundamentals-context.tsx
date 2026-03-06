"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { FundamentalsItem } from "./fundamentals-store";
import {
  getFundamentalsItems,
  addFundamentalsItem as addItem,
  updateFundamentalsItem as updateItem,
  deleteFundamentalsItem as deleteItem,
  getCheckedIdsToday,
  setItemChecked as setCheckedStore,
  resetTodayChecks as resetStore,
} from "./fundamentals-store";

type FundamentalsContextValue = {
  items: FundamentalsItem[];
  checkedIds: string[];
  refresh: () => void;
  addItem: (item: Omit<FundamentalsItem, "id">) => FundamentalsItem;
  updateItem: (id: string, updates: Partial<Omit<FundamentalsItem, "id">>) => FundamentalsItem | null;
  deleteItem: (id: string) => boolean;
  toggleChecked: (id: string) => void;
  resetToday: () => void;
};

const FundamentalsContext = createContext<FundamentalsContextValue | null>(null);

export function FundamentalsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FundamentalsItem[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const refresh = useCallback(() => {
    setItems(getFundamentalsItems());
    setCheckedIds(getCheckedIdsToday());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback((item: Omit<FundamentalsItem, "id">) => {
    const created = addItem(item);
    setItems(getFundamentalsItems());
    return created;
  }, []);

  const update = useCallback((id: string, updates: Partial<Omit<FundamentalsItem, "id">>) => {
    const updated = updateItem(id, updates);
    setItems(getFundamentalsItems());
    return updated;
  }, []);

  const remove = useCallback((id: string) => {
    const ok = deleteItem(id);
    setItems(getFundamentalsItems());
    setCheckedIds(getCheckedIdsToday());
    return ok;
  }, []);

  const toggleChecked = useCallback((id: string) => {
    const current = getCheckedIdsToday();
    setCheckedStore(id, !current.includes(id));
    setCheckedIds(getCheckedIdsToday());
  }, []);

  const resetToday = useCallback(() => {
    resetStore();
    setCheckedIds(getCheckedIdsToday());
  }, []);

  return (
    <FundamentalsContext.Provider
      value={{
        items,
        checkedIds,
        refresh,
        addItem: add,
        updateItem: update,
        deleteItem: remove,
        toggleChecked,
        resetToday,
      }}
    >
      {children}
    </FundamentalsContext.Provider>
  );
}

export function useFundamentals() {
  const ctx = useContext(FundamentalsContext);
  if (!ctx) throw new Error("useFundamentals must be used within FundamentalsProvider");
  return ctx;
}
