"use client";

import { FormEvent, useState } from "react";
import { VoiceTextInput } from "@/components/common/VoiceTextInput";

type TrainingItemFormProps = {
  onCreated?: () => void;
  trainingId: string;
};

export function TrainingItemForm({ onCreated, trainingId }: TrainingItemFormProps) {
  const [durationMinutes, setDurationMinutes] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const duration = Number(durationMinutes);

    if (!Number.isInteger(duration) || duration <= 0) {
      setError("La duree doit etre un entier positif.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch(`/api/trainings/${trainingId}/items`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        durationMinutes: duration
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("La video ou le chapitre n'a pas pu etre cree.");
      return;
    }

    setTitle("");
    setDurationMinutes("");
    onCreated?.();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <VoiceTextInput
        id="training-item-title"
        label="Titre"
        maxLength={160}
        onChange={setTitle}
        placeholder="Video ou chapitre"
        required
        value={title}
      />

      <div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="training-item-duration"
        >
          Duree en minutes
        </label>
        <input
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none focus:border-slate-500"
          id="training-item-duration"
          min={1}
          onChange={(event) => setDurationMinutes(event.target.value)}
          placeholder="10"
          required
          type="number"
          value={durationMinutes}
        />
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        className="rounded bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creation..." : "Ajouter"}
      </button>
    </form>
  );
}
