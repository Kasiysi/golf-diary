"use client";

import { FAB } from "./fab";
import { useOpenQuickAdd } from "@/lib/quick-add-context";

export function FABWrapper() {
  const openQuickAdd = useOpenQuickAdd();
  return <FAB onClick={() => openQuickAdd()} />;
}
