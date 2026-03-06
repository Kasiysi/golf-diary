"use client";

import { useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

const SPEEDS = [
  { label: "0.25×", value: 0.25 },
  { label: "0.5×", value: 0.5 },
  { label: "1×", value: 1 },
  { label: "1.5×", value: 1.5 },
  { label: "2×", value: 2 },
] as const;

type Props = {
  url: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VideoPlayerModal({ url, open, onOpenChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = 1;
  }, [url]);

  const setSpeed = (rate: number) => {
    const video = videoRef.current;
    if (video) video.playbackRate = rate;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
        {url ? (
          <>
            <video
              ref={videoRef}
              src={url}
              controls
              autoPlay
              playsInline
              className="w-full aspect-video"
              onEnded={() => onOpenChange(false)}
            />
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-t border-white/10 bg-white/5 backdrop-blur-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Speed</span>
              <div className="flex flex-wrap gap-1.5">
                {SPEEDS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSpeed(value)}
                    className="h-8 min-w-[3rem] rounded-lg border border-white/10 bg-white/5 px-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--accent)]/20 hover:border-[var(--accent)]/30 hover:text-[var(--accent)] transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-[var(--muted-foreground)]">0.25× / 0.5× for slow-mo</span>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
