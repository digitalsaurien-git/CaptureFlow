"use client";

import { FormEvent, useEffect, useState } from "react";
import { VoiceTextInput } from "@/components/common/VoiceTextInput";

type TrainingDetailsFormProps = {
  description: string | null;
  onChanged?: () => void;
  title: string;
  trainingId: string;
};

export function TrainingDetailsForm({
  description,
  onChanged,
  title,
  trainingId
}: TrainingDetailsFormProps) {
  const [draftDescription, setDraftDescription] = useState(description ?? "");
  const [draftTitle, setDraftTitle] = useState(title);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setDraftTitle(title);
    setDraftDescription(description ?? "");
  }, [description, title]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch(`/api/trainings/${trainingId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: draftTitle,
        description: draftDescription || null
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("La formation n'a pas pu etre modifiee.");
      return;
    }

    onChanged?.();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <VoiceTextInput
        id="training-detail-title"
        label="Titre"
        maxLength={160}
        onChange={setDraftTitle}
        placeholder="Titre formation"
        required
        value={draftTitle}
      />

      <VoiceTextInput
        className="mt-1 min-h-24 w-full resize-y rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none focus:border-slate-500"
        id="training-detail-description"
        label="Description"
        maxLength={5000}
        onChange={setDraftDescription}
        placeholder="Description formation"
        rows="textarea"
        value={draftDescription}
      />

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        className="rounded bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
