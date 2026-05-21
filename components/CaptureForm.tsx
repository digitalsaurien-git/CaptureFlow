"use client";

import { FormEvent, useState } from "react";

type CaptureFormProps = {
  onCreated?: () => void;
};

export function CaptureForm({ onCreated }: CaptureFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/captures", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        title,
        content: content || undefined,
        source: source || undefined
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("La capture n'a pas pu etre enregistree.");
      return;
    }

    setTitle("");
    setContent("");
    setSource("");
    onCreated?.();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="title">
          Titre
        </label>
        <input
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none focus:border-slate-500"
          id="title"
          maxLength={160}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Nouvelle capture"
          required
          value={title}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="content">
          Contenu
        </label>
        <textarea
          className="mt-1 min-h-32 w-full resize-y rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none focus:border-slate-500"
          id="content"
          maxLength={5000}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Note, idee, tache ou contexte utile"
          value={content}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700" htmlFor="source">
          Source
        </label>
        <input
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none focus:border-slate-500"
          id="source"
          maxLength={200}
          onChange={(event) => setSource(event.target.value)}
          placeholder="manuel, mobile, webhook..."
          value={source}
        />
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        className="rounded bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Enregistrement..." : "Capturer"}
      </button>
    </form>
  );
}
