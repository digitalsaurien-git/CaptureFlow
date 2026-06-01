"use client";

import { FormEvent, useState } from "react";
import { VoiceTextInput } from "@/components/common/VoiceTextInput";

type PriorityCloudFormProps = {
  onCreated?: () => void;
};

export function PriorityCloudForm({ onCreated }: PriorityCloudFormProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [label, setLabel] = useState("");
  const [weight, setWeight] = useState(3);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/priority-cloud", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label, weight })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("L'element n'a pas pu etre ajoute.");
      return;
    }

    setLabel("");
    setWeight(3);
    onCreated?.();
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <VoiceTextInput
        id="priority-cloud-label"
        label="Mot ou courte expression"
        maxLength={100}
        onChange={setLabel}
        placeholder="Ex: devis, relance client, idee produit"
        required
        value={label}
      />

      <label className="block text-sm font-medium text-slate-700" htmlFor="priority-cloud-weight">
        Poids
        <select
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none focus:border-slate-500"
          id="priority-cloud-weight"
          onChange={(event) => setWeight(Number(event.target.value))}
          value={weight}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        className="rounded bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Ajout..." : "Ajouter"}
      </button>
    </form>
  );
}
