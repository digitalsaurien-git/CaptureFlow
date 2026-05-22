"use client";

import { useEffect, useRef, useState } from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    0: {
      transcript: string;
    };
    isFinal: boolean;
  }>;
};

type VoiceTextInputProps = {
  id: string;
  label: string;
  maxLength: number;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
  className?: string;
  language?: string;
  required?: boolean;
  rows?: "input" | "textarea";
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function appendTranscript(currentValue: string, transcript: string) {
  const cleanTranscript = transcript.trim();

  if (!cleanTranscript) {
    return currentValue;
  }

  return currentValue ? `${currentValue} ${cleanTranscript}` : cleanTranscript;
}

export function VoiceTextInput({
  className,
  id,
  label,
  language = "fr-FR",
  maxLength,
  onChange,
  placeholder,
  required = false,
  rows = "input",
  value
}: VoiceTextInputProps) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      return;
    }

    setError("");

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language;

    recognition.onresult = (event) => {
      let transcript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];

        if (result.isFinal) {
          transcript += result[0].transcript;
        }
      }

      onChange(appendTranscript(value, transcript));
    };

    recognition.onerror = (event) => {
      const message =
        event.error === "not-allowed"
          ? "Micro refuse par le navigateur."
          : "Dictee interrompue.";

      setError(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  const fieldClassName =
    className ??
    "mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none focus:border-slate-500";

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700" htmlFor={id}>
        {label}
      </label>

      {rows === "textarea" ? (
        <textarea
          className={fieldClassName}
          id={id}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          value={value}
        />
      ) : (
        <input
          className={fieldClassName}
          id={id}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          value={value}
        />
      )}

      {isSupported ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            onClick={isListening ? stopListening : startListening}
            type="button"
          >
            {isListening ? "Arreter la dictee" : "Dicter"}
          </button>
          {isListening ? <span className="text-xs text-slate-500">Ecoute en cours...</span> : null}
        </div>
      ) : null}

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
