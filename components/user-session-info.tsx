"use client";

import { useEffect, useState } from "react";

/** Temporary: shows logged-in user email for session check (same account on PC and iPhone). */
export function UserSessionInfo({ compact }: { compact?: boolean }) {
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { user?: { id: string; email: string | null } | null }) =>
        setUser(data.user ?? null)
      )
      .catch(() => setUser(null));
  }, []);

  if (!user?.email) return null;
  if (compact) {
    return (
      <span className="text-xs text-[var(--muted-foreground)] truncate max-w-[180px]" title={user.email}>
        {user.email}
      </span>
    );
  }
  return (
    <div className="px-3 py-2 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)] truncate" title={user.email}>
      {user.email}
    </div>
  );
}
