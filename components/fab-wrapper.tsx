"use client";

import { usePathname } from "next/navigation";
import { FAB } from "./fab";
import { useOpenQuickAdd } from "@/lib/quick-add-context";

export function FABWrapper() {
  const pathname = usePathname();
  const openQuickAdd = useOpenQuickAdd();
  if (pathname === "/") return null;
  return <FAB onClick={() => openQuickAdd()} />;
}
