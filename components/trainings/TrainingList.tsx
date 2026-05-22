"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type TrainingSummary = {
  id: string;
  title: string;
  description: string | null;
  totalDurationMinutes?: number;
  progressPercent?: number;
  updatedAt: string;
};

type TrainingListProps = {
  refreshKey?: number;
};

export function TrainingList({ refreshKey = 0 }: TrainingListProps) {
  const [trainings, setTrainings] = useState<TrainingSummary[]>([]);
  const [confirmingTrainingId, setConfirmingTrainingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadTrainings = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const response = await fetch("/api/trainings");

    if (!response.ok) {
      setTrainings([]);
      setError("Les formations n'ont pas pu etre chargees.");
      setIsLoading(false);
      return;
    }

    const data = (await response.json()) as { trainings: TrainingSummary[] };
    setTrainings(data.trainings);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadTrainings();
  }, [loadTrainings, refreshKey]);

  async function archiveTraining(trainingId: string) {
    const response = await fetch(`/api/trainings/${trainingId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      setError("La formation n'a pas pu etre archivee.");
      return;
    }

    setConfirmingTrainingId(null);
    await loadTrainings();
  }

  if (isLoading) {
    return <p className="text-sm text-slate-600">Chargement...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (trainings.length === 0) {
    return (
      <p className="rounded border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        Aucune formation pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {trainings.map((training) => (
        <article className="rounded border border-slate-200 bg-white p-4 shadow-sm" key={training.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">{training.title}</h2>
              {training.description ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {training.description}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">
                Mis a jour le {new Date(training.updatedAt).toLocaleString("fr-FR")}
              </p>
            </div>
            {training.totalDurationMinutes !== undefined ||
            training.progressPercent !== undefined ? (
              <div className="flex flex-wrap gap-2 text-xs">
                {training.totalDurationMinutes !== undefined ? (
                  <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                    {training.totalDurationMinutes} min
                  </span>
                ) : null}
                {training.progressPercent !== undefined ? (
                  <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                    {training.progressPercent}%
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              className="rounded bg-slate-950 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              href={`/trainings/${training.id}`}
            >
              Ouvrir
            </Link>
            <button
              className="rounded border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              onClick={() => setConfirmingTrainingId(training.id)}
              type="button"
            >
              Archiver
            </button>
          </div>

          {confirmingTrainingId === training.id ? (
            <div className="mt-3 rounded border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">Archiver cette formation ?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  className="rounded bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
                  onClick={() => void archiveTraining(training.id)}
                  type="button"
                >
                  Oui, archiver
                </button>
                <button
                  className="rounded border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                  onClick={() => setConfirmingTrainingId(null)}
                  type="button"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
