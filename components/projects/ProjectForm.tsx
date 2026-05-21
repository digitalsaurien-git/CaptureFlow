"use client";

import { FormEvent, useState } from "react";

type ProjectFormProps = {
  onCreated?: () => void;
};

export function ProjectForm({ onCreated }: ProjectFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || undefined
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("Le projet n'a pas pu etre cree.");
      return;
    }

    setTitle("");
    setDescription("");
    onCreated?.();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="project-title">
          Titre
        </label>
        <input
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none focus:border-slate-500"
          id="project-title"
          maxLength={160}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Nouveau projet"
          required
          value={title}
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="project-description"
        >
          Description
        </label>
        <textarea
          className="mt-1 min-h-24 w-full resize-y rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none focus:border-slate-500"
          id="project-description"
          maxLength={5000}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Objectif, contexte ou prochaines etapes"
          value={description}
        />
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        className="rounded bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creation..." : "Creer le projet"}
      </button>
    </form>
  );
}
