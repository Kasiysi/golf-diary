"use client";

import { useRef } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { Camera, ImagePlus, Video } from "lucide-react";
import type { MediaItem } from "@/lib/types";

const VIDEO_EXT = /\.(mp4|webm|mov|avi|m4v|mkv)(\?|$)/i;

function fileToMediaItem(file: { name: string; url: string }): MediaItem {
  const isVideo = VIDEO_EXT.test(file.name);
  return {
    id: crypto.randomUUID(),
    type: isVideo ? "video" : "image",
    url: file.url,
    createdAt: new Date().toISOString(),
  };
}

type Props = {
  onUploadComplete: (items: MediaItem[]) => void;
  disabled?: boolean;
};

export function MediaUploadField({ onUploadComplete, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const videoOnlyRef = useRef<HTMLInputElement>(null);
  const { startUpload, isUploading } = useUploadThing("mediaUploader", {
    onClientUploadComplete: (res) => {
      const items = res.map((file) => fileToMediaItem({ name: file.name, url: file.url }));
      onUploadComplete(items);
    },
    onUploadError: (error) => {
      console.error("Upload failed:", error);
    },
  });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const fileList = Array.from(files);
    const result = await startUpload(fileList);
    if (result) {
      const items = result.map((file) => fileToMediaItem({ name: file.name, url: file.url }));
      onUploadComplete(items);
    }
    e.target.value = "";
  };

  return (
    <div className="flex flex-wrap gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="video/*,image/*"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={captureInputRef}
        type="file"
        accept="video/*,image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={videoOnlyRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium shadow-[var(--shadow-sm)] hover:bg-[var(--muted)] disabled:opacity-50"
      >
        <ImagePlus className="h-4 w-4" />
        {isUploading ? "Uploading…" : "Library"}
      </button>
      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={() => captureInputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium shadow-[var(--shadow-sm)] hover:bg-[var(--muted)] disabled:opacity-50"
      >
        <Camera className="h-4 w-4" />
        Camera
      </button>
      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={() => videoOnlyRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50"
        title="On mobile: opens camera to record video directly"
      >
        <Video className="h-4 w-4" />
        Record video
      </button>
    </div>
  );
}
