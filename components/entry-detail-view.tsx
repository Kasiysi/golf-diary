"use client";

import { useState } from "react";
import Image from "next/image";
import type { DiaryEntry, MediaItem } from "@/lib/types";
import { fullMediaUrl, getEntryMedia } from "@/lib/utils";
import { ImageLightbox } from "@/components/image-lightbox";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { Video } from "lucide-react";
import { cn } from "@/lib/utils";

function isAllowedImageUrl(url: string): boolean {
  if (!url) return false;
  try {
    const full = fullMediaUrl(url);
    if (!full) return false;
    const u = new URL(full);
    return u.hostname === "utfs.io" || u.protocol === "data:";
  } catch {
    return false;
  }
}

type Props = {
  entry: DiaryEntry;
  onVideoClick?: (url: string) => void;
  /** When true, render as standalone page content (no modal chrome). */
  standalone?: boolean;
};

export function EntryDetailView({ entry, onVideoClick, standalone }: Props) {
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);

  const instruction =
    entry.instruction ??
    (entry.entryType === "problem" && entry.cure ? entry.cure : entry.notes);
  const instructionEnglish = entry.instruction_english ?? entry.searchSummaryEnglish ?? null;
  const media = getEntryMedia(entry);

  const handleVideoClick = (url: string) => {
    if (onVideoClick) onVideoClick(url);
    else setVideoModalUrl(url);
  };

  return (
    <div
      className={cn(
        "bg-white text-[var(--foreground)]",
        standalone ? "min-h-screen py-10 md:py-14 px-4 md:px-8" : "py-8 px-4"
      )}
    >
      <div className="mx-auto max-w-3xl space-y-12 md:space-y-16">
        {/* Main heading: Cure/Feel in large Masters serif */}
        <header className="space-y-4">
          <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight text-[var(--heading)]">
            {instruction || "Untitled entry"}
          </h1>
        </header>

        {/* Media gallery */}
        {media.length > 0 && (
          <section className="space-y-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Media
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-5">
              {media.map((m) => (
                <MediaCell
                  key={m.id}
                  item={m}
                  onImageClick={() => setLightboxImageUrl(fullMediaUrl(m.url))}
                  onVideoClick={() => handleVideoClick(fullMediaUrl(m.url))}
                />
              ))}
            </div>
          </section>
        )}

        {/* Instructions: Montserrat, clear and readable */}
        <section className="space-y-8 md:space-y-10">
          {instruction && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Instruction
              </h2>
              <p className="font-sans text-lg md:text-xl leading-relaxed text-[var(--foreground)]">
                {instruction}
              </p>
            </div>
          )}
          {instructionEnglish && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Instruction (English)
              </h2>
              <p className="font-sans text-lg md:text-xl leading-relaxed text-[var(--muted-foreground)]">
                {instructionEnglish}
              </p>
            </div>
          )}
          {entry.entryType === "problem" && entry.problemNotes && entry.cure && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                Problem
              </h2>
              <p className="font-sans text-lg md:text-xl leading-relaxed text-[var(--foreground)]">
                {entry.problemNotes}
              </p>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] pt-2">
                Cure
              </h2>
              <p className="font-sans text-lg md:text-xl leading-relaxed text-[var(--foreground)]">
                {entry.cure}
              </p>
            </div>
          )}
        </section>
      </div>

      <ImageLightbox
        imageUrl={lightboxImageUrl}
        open={lightboxImageUrl !== null}
        onOpenChange={(open) => !open && setLightboxImageUrl(null)}
      />
      <VideoPlayerModal
        url={videoModalUrl}
        open={videoModalUrl !== null}
        onOpenChange={(open) => !open && setVideoModalUrl(null)}
      />
    </div>
  );
}

function MediaCell({
  item,
  onImageClick,
  onVideoClick,
}: {
  item: MediaItem;
  onImageClick: () => void;
  onVideoClick: () => void;
}) {
  const url = fullMediaUrl(item.url);
  const thumbUrl = fullMediaUrl(item.thumbnailUrl);
  const isImage = item.type === "image";
  const useNextImage = isImage && isAllowedImageUrl(item.url);

  if (item.type === "video") {
    return (
      <button
        type="button"
        onClick={onVideoClick}
        className="aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)] relative focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
        aria-label="Play video"
      >
        {thumbUrl ? (
          <Image
            src={thumbUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <video
            src={url}
            muted
            preload="metadata"
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Video className="h-10 w-10 text-white drop-shadow" />
        </div>
      </button>
    );
  }

  if (!url) return null;

  return (
    <button
      type="button"
      onClick={onImageClick}
      className="aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--muted)] relative focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
      aria-label="Enlarge image"
    >
      {useNextImage ? (
        <Image
          src={url}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, 33vw"
          className="object-cover"
          unoptimized
        />
      ) : (
        <img src={url} alt="" className="w-full h-full object-cover" />
      )}
    </button>
  );
}
