"use client";

import { useState } from "react";
import { useFundamentals } from "@/lib/fundamentals-context";
import type { FundamentalsItem } from "@/lib/fundamentals-store";
import { ListChecks, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ManageChecklistPage() {
  const { items, addItem, updateItem, deleteItem, refresh } = useFundamentals();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FundamentalsItem | null>(null);
  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");

  const openAdd = () => {
    setEditing(null);
    setTitle("");
    setWhy("");
    setModalOpen(true);
  };

  const openEdit = (item: FundamentalsItem) => {
    setEditing(item);
    setTitle(item.title);
    setWhy(item.why);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    if (editing) {
      updateItem(editing.id, { title: title.trim(), why: why.trim() });
    } else {
      addItem({ title: title.trim(), why: why.trim() });
    }
    setModalOpen(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (typeof window !== "undefined" && window.confirm("Remove this item from the checklist?")) {
      deleteItem(id);
      refresh();
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-white shadow-sm">
        <div className="flex h-14 items-center px-4 md:px-6">
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <ListChecks className="h-5 w-5 text-[var(--accent)]" />
            Manage Checklist
          </h1>
        </div>
      </header>
      <div className="p-4 md:p-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
          Add, edit, or remove fundamentals. These appear on the home screen.
        </p>
        <Button
          onClick={openAdd}
          className="gap-2 bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add item
        </Button>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-[var(--border)] bg-white shadow-[var(--shadow)] p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--foreground)]">{item.title}</p>
                  {item.why ? (
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Why: {item.why}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="p-2 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-[var(--muted-foreground)] hover:text-red-400"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-muted)] p-8 text-center text-[var(--muted-foreground)] text-sm">
            No checklist items yet. Add one to get started.
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border border-[var(--border)] bg-white shadow-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit item" : "Add item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Grip pressure"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Why (short note)
              </label>
              <Textarea
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                placeholder="Why this matters..."
                rows={2}
                className="resize-none border-[var(--border)] bg-white focus:ring-[var(--accent)]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()} className="bg-[var(--accent)] text-[var(--accent-foreground)]">
              {editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
