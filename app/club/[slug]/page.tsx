"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEntries } from "@/lib/entries-context";
import { CLUB_CATEGORIES, ENTRY_TYPES } from "@/lib/constants";
import type { ClubCategory, EntryType } from "@/lib/types";
import { EntryCard } from "@/components/entry-card";
import { VideoPlayerModal } from "@/components/video-player-modal";
import { ImageLightbox } from "@/components/image-lightbox";
import {
  Heart,
  AlertCircle,
  Dumbbell,
  MessageSquare,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ENTRY_ICONS: Record<EntryType, React.ComponentType<{ className?: string }>> = {
  feel: Heart,
  problem: AlertCircle,
  drill: Dumbbell,
  "coach-advice": MessageSquare,
};

export default function ClubPage() {
  const params = useParams();
  const slug = params.slug as string;
  const entries = useEntries();
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);

  const club = CLUB_CATEGORIES.find((c) => c.value === slug);
  if (!club) {
    return (
      <div className="p-6">
        <p className="text-[var(--muted-foreground)]">Club not found.</p>
      </div>
    );
  }

  const clubEntries = [...entries]
    .filter((e) => e.club === slug)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const media = clubEntries.flatMap((e) => e.media);

  const byType = (type: EntryType) =>
    clubEntries.filter((e) => e.entryType === type);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-white shadow-sm">
        <div className="flex h-14 items-center px-4 md:px-6">
          <h1 className="text-lg font-semibold text-[var(--foreground)]">
            {club.label}
          </h1>
        </div>
      </header>

      <div className="p-4 md:p-6 space-y-8">
        {/* Sections by entry type */}
        {ENTRY_TYPES.map(({ value, label }) => {
          const list = byType(value);
          const Icon = ENTRY_ICONS[value];
          if (list.length === 0) return null;
          return (
            <section key={value}>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                <Icon className="h-4 w-4" />
                {label}
              </h2>
              <ul className="space-y-3">
                {list.map((entry) => (
                  <li key={entry.id}>
                    <EntryCard
                      entry={entry}
                      compact
                      onVideoClick={(url) => setVideoModalUrl(url)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {/* Media Gallery */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
            <ImageIcon className="h-4 w-4" />
            Media Gallery
          </h2>
          {media.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-muted)] p-6 text-center text-sm text-[var(--muted-foreground)]">
              No photos or videos for this club yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {media.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "aspect-square rounded-lg border border-[var(--border)] bg-[var(--muted)] overflow-hidden relative",
                    (m.type === "video" || m.type === "image") && "cursor-pointer"
                  )}
                  role={(m.type === "video" || m.type === "image") ? "button" : undefined}
                  tabIndex={(m.type === "video" || m.type === "image") ? 0 : undefined}
                  onClick={
                    m.type === "video"
                      ? () => setVideoModalUrl(m.url)
                      : m.type === "image" && (m.url.startsWith("https://utfs.io") || m.url.startsWith("data:") || m.url.startsWith("http") || m.url.startsWith("/"))
                        ? () => setLightboxImageUrl(m.url)
                        : undefined
                  }
                  onKeyDown={
                    m.type === "video"
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setVideoModalUrl(m.url);
                          }
                        }
                      : m.type === "image"
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setLightboxImageUrl(m.url);
                            }
                          }
                        : undefined
                  }
                >
                  {m.type === "video" ? (
                    <>
                      {m.thumbnailUrl ? (
                        <Image
                          src={m.thumbnailUrl}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-cover"
                        />
                      ) : (
                        <video
                          src={m.url}
                          muted
                          preload="metadata"
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Video className="h-8 w-8 text-[var(--accent)] drop-shadow" />
                      </div>
                    </>
                  ) : (
                    (m.url.startsWith("https://utfs.io") || m.url.startsWith("data:")) ? (
                      <Image
                        src={m.url}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover"
                      />
                    ) : m.url.startsWith("http") || m.url.startsWith("/") ? (
                      <img
                        src={m.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-[var(--muted-foreground)]" />
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <VideoPlayerModal
          url={videoModalUrl}
          open={videoModalUrl !== null}
          onOpenChange={(open) => !open && setVideoModalUrl(null)}
        />

        <ImageLightbox
          imageUrl={lightboxImageUrl}
          open={lightboxImageUrl !== null}
          onOpenChange={(open) => !open && setLightboxImageUrl(null)}
        />

        {clubEntries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-muted)] p-8 text-center text-[var(--muted-foreground)]">
            No entries for {club.label} yet. Use the + button to add one.
          </div>
        )}
      </div>
    </div>
  );
}
