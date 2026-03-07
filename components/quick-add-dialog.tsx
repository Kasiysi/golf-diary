"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaUploadField } from "@/components/media-upload-field";
import { VoiceInputButton } from "@/components/voice-input-button";
import { CLUB_CATEGORIES, ENTRY_TYPES, SWING_PHASES } from "@/lib/constants";
import { useAddEntry, useUpdateEntry } from "@/lib/entries-context";
import type { ClubCategory, EntryType, SwingPhase, MediaItem, DiaryEntry } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEntry?: DiaryEntry | null;
};

export function QuickAddDialog({ open, onOpenChange, initialEntry }: Props) {
  const addEntry = useAddEntry();
  const updateEntry = useUpdateEntry();
  const [club, setClub] = useState<ClubCategory | "">("");
  const [swingPhase, setSwingPhase] = useState<SwingPhase>("none");
  const [entryType, setEntryType] = useState<EntryType | "">("");
  const [notes, setNotes] = useState("");
  const [problemNotes, setProblemNotes] = useState("");
  const [cure, setCure] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [uploadedMedia, setUploadedMedia] = useState<MediaItem[]>([]);
  const [entryDate, setEntryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialEntry?.id);
  const isProblemType = entryType === "problem";

  useEffect(() => {
    if (open && initialEntry) {
      setClub(initialEntry.club);
      setSwingPhase(initialEntry.swingPhase ?? "none");
      setEntryType(initialEntry.entryType);
      setNotes(initialEntry.notes);
      setProblemNotes(initialEntry.problemNotes ?? "");
      setCure(initialEntry.cure ?? "");
      setYoutubeLink(initialEntry.youtubeLink ?? "");
      setUploadedMedia(initialEntry.media);
      setEntryDate(initialEntry.createdAt.slice(0, 10));
    } else if (open && !initialEntry) {
      setClub("");
      setSwingPhase("none");
      setEntryType("");
      setNotes("");
      setProblemNotes("");
      setCure("");
      setYoutubeLink("");
      setUploadedMedia([]);
      setEntryDate(new Date().toISOString().slice(0, 10));
    }
  }, [open, initialEntry]);

  const handleSubmitWithAiSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!club || !entryType || submitting) return;

    setSubmitting(true);
    try {
    const combinedNote =
      isProblemType
        ? [problemNotes.trim(), cure.trim()].filter(Boolean).join(" ")
        : notes.trim();
    let searchSummaryEnglish: string | null = null;
    if (combinedNote) {
      try {
        const res = await fetch("/api/analyze-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: combinedNote }),
        });
        const data = await res.json();
        if (data?.notesResult?.summaryEnglish) {
          searchSummaryEnglish = data.notesResult.summaryEnglish;
        }
      } catch {
        // proceed without summary
      }
    }

    const createdAtISO = entryDate ? new Date(entryDate + "T12:00:00").toISOString() : undefined;
    const payload = {
      club,
      swingPhase: swingPhase === "none" ? undefined : swingPhase,
      entryType,
      notes: isProblemType ? "" : notes.trim(),
      problemNotes: isProblemType ? problemNotes.trim() : undefined,
      cure: isProblemType ? cure.trim() : undefined,
      youtubeLink: youtubeLink.trim() || undefined,
      media: uploadedMedia,
      ...(searchSummaryEnglish != null && { searchSummaryEnglish }),
      ...(createdAtISO && { createdAt: createdAtISO }),
      ...(isEditing && initialEntry && { priority: initialEntry.priority }),
    };

    if (isEditing && initialEntry) {
      updateEntry(initialEntry.id, {
        ...payload,
        createdAt: entryDate ? new Date(entryDate + "T12:00:00").toISOString() : initialEntry.createdAt,
      });
    } else {
      addEntry({ ...payload, createdAt: createdAtISO ?? new Date().toISOString() });
    }

    setClub("");
    setSwingPhase("none");
    setEntryType("");
    setNotes("");
    setProblemNotes("");
    setCure("");
    setYoutubeLink("");
    setUploadedMedia([]);
    setEntryDate("");
    onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Entry" : "Quick Add Entry"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmitWithAiSummary} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Category</label>
            <Select value={club} onValueChange={(v) => setClub(v as ClubCategory)} required>
              <SelectTrigger>
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent>
                {CLUB_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Swing Phase</label>
            <Select value={swingPhase} onValueChange={(v) => setSwingPhase(v as SwingPhase)}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {SWING_PHASES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Entry Type</label>
            <Select value={entryType} onValueChange={(v) => setEntryType(v as EntryType)} required>
              <SelectTrigger>
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent>
                {ENTRY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isProblemType ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium">The Problem</label>
                  <VoiceInputButton
                    onTranscript={(text, isFinal) => {
                      if (isFinal) setProblemNotes((prev) => (prev ? prev + " " : "") + text);
                    }}
                    aria-label="Voice input for problem"
                  />
                </div>
                <Textarea
                  placeholder="Describe the problem…"
                  value={problemNotes}
                  onChange={(e) => setProblemNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-sm font-medium">The Cure</label>
                  <VoiceInputButton
                    onTranscript={(text, isFinal) => {
                      if (isFinal) setCure((prev) => (prev ? prev + " " : "") + text);
                    }}
                    aria-label="Voice input for cure"
                  />
                </div>
                <Textarea
                  placeholder="What fixed it or the fix to try…"
                  value={cure}
                  onChange={(e) => setCure(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium">Notes</label>
                <VoiceInputButton
                  onTranscript={(text, isFinal) => {
                    if (isFinal) setNotes((prev) => (prev ? prev + " " : "") + text);
                  }}
                  aria-label="Voice input for notes"
                />
              </div>
              <Textarea
                placeholder=""
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">YouTube Link</label>
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=… or youtu.be/…"
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              className="flex h-9 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Photos / Swing videos</label>
            <p className="text-xs text-[var(--muted-foreground)]">
              Choose from library or open camera to record.
            </p>
            <MediaUploadField
              onUploadComplete={(items) => setUploadedMedia((prev) => [...prev, ...items])}
            />
            {uploadedMedia.length > 0 && (
              <p className="text-xs text-[var(--muted-foreground)]">
                {uploadedMedia.length} file(s) uploaded. They will be saved with this entry.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : isEditing ? "Save" : "Add Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
