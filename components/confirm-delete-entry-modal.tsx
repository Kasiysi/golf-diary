"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
};

const DEFAULT_TITLE = "Are you sure you want to delete this entry?";

export function ConfirmDeleteEntryModal({
  open,
  onOpenChange,
  onConfirm,
  title = DEFAULT_TITLE,
}: Props) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm bg-white border-[var(--border)] shadow-[var(--shadow-md)] rounded-2xl font-sans"
        aria-describedby="confirm-delete-description"
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[var(--foreground)]">
            Delete entry
          </DialogTitle>
        </DialogHeader>
        <p
          id="confirm-delete-description"
          className="text-[var(--foreground)] text-base leading-relaxed font-sans"
        >
          {title}
        </p>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
