"use client";

import * as React from "react";
import { X } from "lucide-react";

type Props = {
  imageUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alt?: string;
};

export function ImageLightbox({ imageUrl, open, onOpenChange, alt = "" }: Props) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Enlarge image"
      onClick={() => onOpenChange(false)}
    >
      <button
        type="button"
        className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/90 hover:bg-white/10 hover:text-white"
        onClick={() => onOpenChange(false)}
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      <img
        src={imageUrl}
        alt={alt}
        className="max-h-[100vh] max-w-[100vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
