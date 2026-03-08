"use client";

import { useState } from "react";
import Image from "next/image";
import type { DiaryEntry, EntryType } from "@/lib/types";
import { CLUB_CATEGORIES, ENTRY_TYPES, SWING_PHASES } from "@/lib/constants";
import {
  Video,
  Calendar,
  Pencil,
  Star,
  Trash2,
  Lightbulb,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { cn, getYouTubeVideoId } from "@/lib/utils";
import { useOpenQuickAdd } from "@/lib/quick-add-context";
import { useTogglePriority, useDeleteEntry } from "@/lib/entries-context";
import { ImageLightbox } from "@/components/image-lightbox";

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return "Today";
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString();
}

const ENTRY_TYPE_ICONS: Record<EntryType, React.ComponentType<{ className?: string }>> = {
  feel: Lightbulb,
  problem: TriangleAlert,
  drill: Wrench,
  "coach-advice": Star,
};

const ENTRY_TYPE_GLOW: Record<EntryType, string> = {
  feel: "bg-amber-50 ring-amber-200 text-amber-700",
  problem: "bg-red-50 ring-red-200 text-red-700",
  drill: "bg-blue-50 ring-blue-200 text-blue-700",
  "coach-advice": "bg-[var(--accent)]/10 ring-[var(--accent)]/20 text-[var(--accent)]",
};

const UTFS_IO_ORIGIN = "https://utfs.io";

/** Ensure media URLs are full (https://utfs.io/... or other absolute URL). Never returns undefined. */
function fullMediaUrl(url: string | undefined | null): string {
  if (url == null || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${UTFS_IO_ORIGIN}${path}`;
}

/** True if we have a non-empty URL safe to use as image/video src. */
function hasValidMediaUrl(url: string | undefined | null): boolean {
  const full = fullMediaUrl(url);
  return full.length > 0;
}

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

export function EntryCard({
  entry,
  compact = false,
  onVideoClick,
  onEntryClick,
}: {
  entry: DiaryEntry;
  compact?: boolean;
  onVideoClick?: (url: string) => void;
  onEntryClick?: (entry: DiaryEntry) => void;
}) {
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const openQuickAdd = useOpenQuickAdd();
  const togglePriority = useTogglePriority();
  const deleteEntry = useDeleteEntry();
  const clubLabel = CLUB_CATEGORIES.find((c) => c.value === entry?.club)?.label ?? entry?.club ?? "";
  const typeLabel = ENTRY_TYPES.find((t) => t.value === entry.entryType)?.label ?? entry.entryType;
  const swingPhaseLabel =
    entry.swingPhase && entry.swingPhase !== "none"
      ? SWING_PHASES.find((p) => p.value === entry.swingPhase)?.label
      : null;
  const media = entry?.media ?? [];
  const hasVideo = media.some((m) => m.type === "video");
  const hasImage = media.some((m) => m.type === "image");
  const firstMedia = media[0];

  // YouTube: same for Long Game, Short Game, Putting, Coach's Advice — no category filter. Check instruction, content, and all text fields.
  const textForYoutube = [
    entry.youtubeLink,
    entry.notes,
    entry.problemNotes,
    entry.cure,
    (entry as { instruction?: string }).instruction,
    (entry as { instruction_english?: string }).instruction_english,
    (entry as { content?: string }).content,
    (entry as { content_english?: string }).content_english,
  ]
    .filter(Boolean)
    .join(" ");
  // watch, Shorts (/shorts/), youtu.be → same video ID; embed URL is always /embed/ID (works in all categories including Short Game)
  const youtubeId = getYouTubeVideoId(textForYoutube);

  // Main text: prefer instruction/content when present (DB columns), else notes/problemNotes
  const mainText =
    (entry as { instruction?: string }).instruction ??
    (entry as { content?: string }).content ??
    (entry.entryType === "problem" && entry.problemNotes
      ? entry.problemNotes
      : entry.notes);
  const hasCure = entry.entryType === "problem" && entry.cure;
  const EntryTypeIcon = ENTRY_TYPE_ICONS[entry.entryType];

  const thumbContainerClass = "shrink-0 w-20 h-20 rounded-xl overflow-hidden relative flex items-center justify-center bg-[var(--muted)] border border-[var(--border)]";
  const videoUrl = firstMedia?.type === "video" ? fullMediaUrl(firstMedia.url) : "";
  const videoThumbUrl = firstMedia?.type === "video" ? fullMediaUrl(firstMedia?.thumbnailUrl) : "";
  const imageUrl = firstMedia?.type === "image" ? fullMediaUrl(firstMedia.url) : "";
  const hasVideoUrl = hasValidMediaUrl(videoUrl);
  const hasVideoThumbUrl = hasValidMediaUrl(videoThumbUrl);
  const hasImageUrl = hasValidMediaUrl(imageUrl) && imageUrl.length > 0;
  const showVideoThumb = firstMedia?.type === "video" && hasVideoThumbUrl;
  const showVideoElement = firstMedia?.type === "video" && hasVideoUrl && !showVideoThumb;
  const showNextImage = firstMedia?.type === "image" && hasImageUrl && isAllowedImageUrl(firstMedia.url);
  const showImgFallback = firstMedia?.type === "image" && hasImageUrl && !showNextImage;
  const showIcon = !firstMedia || (!showVideoThumb && !showVideoElement && !showNextImage && !showImgFallback);

  const mediaThumb = (
    <div className={cn(thumbContainerClass)}>
      {firstMedia?.type === "video" && (showVideoThumb || showVideoElement) ? (
        <>
          {showVideoThumb && videoThumbUrl ? (
            <Image
              src={videoThumbUrl}
              alt=""
              fill
              sizes="80px"
              className="object-cover rounded-2xl"
              unoptimized
            />
          ) : showVideoElement && videoUrl ? (
            <video
              src={videoUrl}
              muted
              preload="metadata"
              playsInline
              className="absolute inset-0 w-full h-full object-cover rounded-2xl"
            />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl">
            <Video className="h-8 w-8 text-[var(--accent)]" />
          </div>
        </>
      ) : showNextImage && imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="80px"
          className="object-cover rounded-2xl"
          unoptimized
        />
      ) : showImgFallback && imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover rounded-2xl"
        />
      ) : null}
      {showIcon ? (
        <span
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-[var(--border)]",
            firstMedia?.type === "video" ? "bg-[var(--accent)]/10 ring-[var(--accent)]/20 text-[var(--accent)]" : ENTRY_TYPE_GLOW[entry.entryType]
          )}
        >
          {firstMedia?.type === "video" ? (
            <Video className="h-6 w-6" aria-hidden />
          ) : (
            <EntryTypeIcon className="h-6 w-6" aria-hidden />
          )}
        </span>
      ) : null}
    </div>
  );

  return (
    <>
      <article
      className={cn(
        "rounded-xl overflow-hidden bg-white border border-[var(--border)] shadow-[var(--shadow-sm)] transition-shadow",
        compact ? "p-3" : "p-4",
        onEntryClick && "cursor-pointer hover:shadow-md"
      )}
      onClick={(e) => {
        if (onEntryClick && !(e.target as HTMLElement).closest("button")) {
          onEntryClick(entry);
        }
      }}
      role={onEntryClick ? "button" : undefined}
      tabIndex={onEntryClick ? 0 : undefined}
      onKeyDown={
        onEntryClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onEntryClick(entry);
              }
            }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        {firstMedia?.type === "video" && onVideoClick ? (
          <button
            type="button"
            onClick={() => onVideoClick(firstMedia.url)}
            className={cn(thumbContainerClass, "focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-white")}
            aria-label="Play swing video"
          >
            {mediaThumb}
          </button>
        ) : firstMedia?.type === "image" && imageUrl ? (
          <button
            type="button"
            onClick={() => setLightboxImageUrl(imageUrl)}
            className={cn(thumbContainerClass, "cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-white")}
            aria-label="Enlarge image"
          >
            {mediaThumb}
          </button>
        ) : (
          mediaThumb
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center rounded-lg bg-[var(--accent)]/10 px-2 py-0.5 font-medium text-[var(--accent)] border border-[var(--accent)]/20 uppercase tracking-wider">
              {clubLabel}
            </span>
            {swingPhaseLabel && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 font-medium text-blue-700 border border-blue-200 uppercase tracking-wider" title="Swing phase">
                <span className="text-[10px] opacity-80">Phase:</span>
                {swingPhaseLabel}
              </span>
            )}
            <span className="text-[var(--muted-foreground)] uppercase tracking-wider">{typeLabel}</span>
            <span className="flex items-center gap-1 text-[var(--muted-foreground)] uppercase tracking-wider">
              <Calendar className="h-3 w-3" />
              {formatDate(entry.createdAt)}
            </span>
            <div className="ml-auto flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => togglePriority(entry.id)}
                className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
                aria-label={entry.priority ? "Remove priority" : "Mark as priority"}
                title={entry.priority ? "Poista prioriteetti" : "Merkitse prioriteetiksi (is_priority)"}
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    entry.priority
                      ? "fill-[var(--accent)] text-[var(--accent)]"
                      : "text-[var(--muted-foreground)]"
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() => openQuickAdd(entry)}
                className="p-1.5 rounded-lg hover:bg-[var(--muted)] transition-colors"
                aria-label="Edit entry"
              >
                <Pencil className="h-4 w-4 text-[var(--muted-foreground)]" />
              </button>
              <button
                type="button"
                onClick={() => deleteEntry(entry.id)}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-[var(--muted-foreground)] hover:text-red-400 transition-colors"
                aria-label="Delete entry"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className={cn("mt-1 text-sm text-[var(--foreground)]", compact && "line-clamp-2")}>
            {mainText}
          </p>
          {hasCure && (
            <div className="mt-2 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                Cure
              </p>
              <p className={cn("mt-0.5 text-sm text-[var(--foreground)]", compact && "line-clamp-2")}>
                {entry.cure}
              </p>
            </div>
          )}
          {/* YouTube embed: all categories (Long Game, Short Game, Putting, Coach's Advice); link from instruction, content, notes, cure, youtubeLink */}
          {youtubeId && (
            <div className="mt-2 rounded-lg overflow-hidden aspect-video max-w-full bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}
          {/* AI Coach: suggested YouTube (all categories); direct video = embed, search URL = link */}
          {(entry?.suggestedVideoUrl ?? (entry as { suggested_video_url?: string } | undefined)?.suggested_video_url) && (() => {
            const url = (entry?.suggestedVideoUrl ?? (entry as { suggested_video_url?: string } | undefined)?.suggested_video_url) ?? "";
            const embedId = getYouTubeVideoId(url);
            return (
              <div className="mt-2 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                  AI suosittelee harjoitusta
                </p>
                {embedId ? (
                  <div className="mt-1.5 rounded-lg overflow-hidden aspect-video max-w-full bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${embedId}`}
                      title="AI suosittelee harjoitusta"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm text-[var(--accent)] underline hover:opacity-90"
                  >
                    Katso harjoituksia YouTubessa →
                  </a>
                )}
              </div>
            );
          })()}
          {(hasVideo || hasImage) && (entry?.media?.length ?? 0) > 1 && (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              +{Math.max(0, (entry?.media?.length ?? 0) - 1)} more
            </p>
          )}
        </div>
      </div>
      </article>
      <ImageLightbox
        imageUrl={lightboxImageUrl}
        open={lightboxImageUrl !== null}
        onOpenChange={(open) => !open && setLightboxImageUrl(null)}
      />
    </>
  );
}
