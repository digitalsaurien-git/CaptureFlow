"use client";

import { FormEvent, useState } from "react";
import { VoiceTextInput } from "@/components/common/VoiceTextInput";

type TaskFormProps = {
  onCreated?: () => void;
  projectId: string;
};

export function TaskForm({ onCreated, projectId }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("La tache n'a pas pu etre creee.");
      return;
    }

    setTitle("");
    setDescription("");
    onCreated?.();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <VoiceTextInput
        id="task-title"
        label="Titre"
        maxLength={160}
        onChange={setTitle}
        placeholder="Nouvelle tache"
        required
        value={title}
      />

      <VoiceTextInput
        className="mt-1 min-h-20 w-full resize-y rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none focus:border-slate-500"
        id="task-description"
        label="Description"
        maxLength={5000}
        onChange={setDescription}
        placeholder="Details utiles"
        rows="textarea"
        value={description}
      />

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        className="rounded bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creation..." : "Ajouter la tache"}
      </button>
    </form>
  );
}
