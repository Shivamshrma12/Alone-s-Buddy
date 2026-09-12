"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventLike extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseVoiceDistressOptions {
  onDistressDetected: (triggerPhrase: string) => void;
  isEmergencyActive?: boolean;
}

export function useVoiceDistress({
  onDistressDetected,
  isEmergencyActive = false,
}: UseVoiceDistressOptions) {
  const [isSupported] = useState(() => {
    if (typeof window !== "undefined") {
      return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
    return false;
  });

  const [isListening, setIsListening] = useState(false);
  const [lastDetectedPhrase, setLastDetectedPhrase] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(false);
  const callbackRef = useRef(onDistressDetected);
  const isEmergencyActiveRef = useRef(isEmergencyActive);

  useEffect(() => {
    callbackRef.current = onDistressDetected;
  }, [onDistressDetected]);

  useEffect(() => {
    isEmergencyActiveRef.current = isEmergencyActive;
    // If emergency became active, pause recognition to prevent duplicate triggers
    if (isEmergencyActive && recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
  }, [isEmergencyActive]);

  // Distress pattern check
  const checkTrigger = useCallback((text: string) => {
    if (isEmergencyActiveRef.current) return false;

    const cleaned = text.toLowerCase().trim();
    setLiveTranscript(cleaned);

    // Distress triggers: "help", "bachao", and Devanagari "बचाओ"
    // Does NOT require an exact sentence; checks if phrase contains the trigger anywhere.
    const distressWords = [
      "help",
      "bachao",
      "बचाओ",
      "bachaiye",
      "बचाइए",
      "emergency",
    ];

    for (const word of distressWords) {
      if (cleaned.includes(word)) {
        console.warn(`[Voice Distress Guard] MATCH TRIGGERED: "${word}" in transcript: "${cleaned}"`);
        setLastDetectedPhrase(word);
        callbackRef.current(word);
        return true;
      }
    }
    return false;
  }, []);

  const startListening = useCallback(async () => {
    if (typeof window === "undefined") return;

    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) {
      setErrorMessage("Speech recognition not supported in this browser. Use Chrome or Edge.");
      return;
    }

    setErrorMessage(null);
    isActiveRef.current = true;

    // Optional mic permission check using getUserMedia to ensure prompt appears on user click
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately release stream since SpeechRecognition handles audio capture
        stream.getTracks().forEach((track) => track.stop());
      } catch (micErr) {
        console.warn("[Voice Distress Guard] Microphone access denied or unavailable:", micErr);
        setErrorMessage("Microphone permission denied. Please allow microphone in browser settings.");
        setIsListening(false);
        isActiveRef.current = false;
        return;
      }
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      // Prefer en-IN for optimal English + Indian vernacular/Hinglish (e.g. "bachao") recognition
      recognition.lang = "en-IN";

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcript = result[0]?.transcript;
          if (transcript) {
            checkTrigger(transcript);
          }
        }
      };

      recognition.onerror = (event: Event) => {
        const errorDetail = (event as unknown as { error?: string })?.error;
        if (errorDetail === "no-speech") {
          // Benign regular silence event, do not treat as error
          return;
        }

        console.warn("[Voice Distress Guard] Speech error:", errorDetail);
        if (errorDetail === "not-allowed") {
          setErrorMessage("Microphone permission denied");
          setIsListening(false);
          isActiveRef.current = false;
        } else if (errorDetail === "network") {
          setErrorMessage("Speech recognition network error");
        } else if (errorDetail) {
          setErrorMessage(`Speech recognition error: ${errorDetail}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Automatically restart to keep continuously listening UNLESS explicitly stopped or emergency triggered
        if (isActiveRef.current && !isEmergencyActiveRef.current) {
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (isActiveRef.current && !isEmergencyActiveRef.current) {
              try {
                recognition.start();
                setIsListening(true);
              } catch {
                // Ignore fast restart collisions
              }
            }
          }, 300);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      setErrorMessage(null);
      console.log("[Voice Distress Guard] Speech recognition started (en-IN). Listening for HELP / BACHAO / बचाओ...");
    } catch (err) {
      console.warn("[Voice Distress Guard] Failed to start recognition:", err);
      const msg = err instanceof Error ? err.message : "Failed to start speech recognition";
      setErrorMessage(msg);
      setIsListening(false);
      isActiveRef.current = false;
    }
  }, [checkTrigger]);

  const stopListening = useCallback(() => {
    isActiveRef.current = false;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setLiveTranscript("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isSupported,
    isListening,
    lastDetectedPhrase,
    errorMessage,
    liveTranscript,
    startListening,
    stopListening,
  };
}
