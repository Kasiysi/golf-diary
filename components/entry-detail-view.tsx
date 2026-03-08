"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { DiaryEntry, MediaItem } from "@/lib/types";
import { fullMediaUrl, getEntryMedia } from "@/lib/utils";
import { ImageLightbox } from "@/components/image-lightbox";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { LinkEntryPickerModal } from "@/components/link-entry-picker-modal";
import { getLinkedEntryIds } from "@/lib/entry-connections";
import { ENTRY_TYPES } from "@/lib/constants";
import { useEntryDetail } from "@/lib/entry-detail-context";
import { Video, Link2 } from "lucide-react";
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
  allEntries?: DiaryEntry[];
  onVideoClick?: (url: string) => void;
  /** When true, render as standalone page content (no modal chrome). */
  standalone?: boolean;
  /** Callback when connections change (e.g. refresh parent). */
  onConnectionsChange?: () => void;
  /** When provided, linked entry cards use this instead of opening in modal (e.g. navigate to /diary/[id]). */
  onOpenLinkedEntry?: (entry: DiaryEntry) => void;
};

export function EntryDetailView({ entry, allEntries = [], onVideoClick, standalone, onConnectionsChange, onOpenLinkedEntry }: Props) {
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [connectionsVersion, setConnectionsVersion] = useState(0);

  const linkedEntryIds = useMemo(
    () => getLinkedEntryIds(entry.id),
    [entry.id, connectionsVersion]
  );
  const linkedEntries = useMemo(() => {
    const ids = new Set(linkedEntryIds);
    return allEntries.filter((e) => ids.has(e.id));
  }, [allEntries, linkedEntryIds]);

  const handleConnectionsSaved = () => {
    setConnectionsVersion((v) => v + 1);
    onConnectionsChange?.();
  };

  const entryDetail = useEntryDetail();

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

        {/* Link to another entry */}
        <section className="space-y-3">
          <button
            type="button"
            onClick={() => setLinkPickerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-2.5 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors"
          >
            <Link2 className="h-4 w-4" />
            Link to another entry
          </button>
        </section>

        {/* Linked entries: small Masters-style cards */}
        {linkedEntries.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Linked entries
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {linkedEntries.map((linked) => (
                <LinkedEntryCard
                  key={linked.id}
                  entry={linked}
                  onOpen={() =>
                    onOpenLinkedEntry
                      ? onOpenLinkedEntry(linked)
                      : entryDetail?.openEntryDetail(linked)
                  }
                />
              ))}
            </div>
          </section>
        )}
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

      <LinkEntryPickerModal
        entry={entry}
        allEntries={allEntries}
        currentLinkedIds={linkedEntryIds}
        open={linkPickerOpen}
        onOpenChange={setLinkPickerOpen}
        onSaved={handleConnectionsSaved}
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

/** Small Masters-style card for a linked entry in Detail View. */
function LinkedEntryCard({
  entry,
  onOpen,
}: {
  entry: DiaryEntry;
  onOpen: () => void;
}) {
  const typeLabel = ENTRY_TYPES.find((t) => t.value === entry.entryType)?.label ?? entry.entryType;
  const title =
    (entry.instruction ??
      (entry.entryType === "problem" && entry.cure ? entry.cure : entry.notes)) ||
    "Untitled";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left rounded-xl border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)] hover:border-[var(--accent)]/30 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
        {typeLabel}
      </span>
      <p className="font-heading mt-1 text-base font-semibold text-[var(--heading)] line-clamp-2">
        {title}
      </p>
    </button>
  );
}
