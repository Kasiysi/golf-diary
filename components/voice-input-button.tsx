"use client";

import { useState, useRef, useCallback } from "react";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

type Props = {
  /** Called with transcribed text; isFinal true means this segment is final and should be appended. */
  onTranscript: (text: string, isFinal: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function VoiceInputButton({ onTranscript, disabled, className, "aria-label": ariaLabel }: Props) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      console.warn("Speech recognition not supported");
      return;
    }
    stopListening();
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        }
      }
      if (finalText) onTranscript(finalText, true);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (e) {
      console.warn("Speech recognition start failed", e);
    }
  }, [onTranscript, stopListening]);

  const handleClick = () => {
    if (isListening) stopListening();
    else startListening();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel ?? (isListening ? "Stop listening" : "Start voice input")}
      className={cn(
        "shrink-0 flex items-center justify-center rounded-lg p-2 transition-colors",
        "hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {isListening ? (
        <span className="relative flex h-8 w-8 items-center justify-center">
          <span className="absolute h-3 w-3 rounded-full bg-red-500 animate-ping opacity-80" />
          <span className="relative h-3 w-3 rounded-full bg-red-500" />
        </span>
      ) : (
        <Mic className="h-5 w-5 text-[var(--muted-foreground)]" />
      )}
    </button>
  );
}
