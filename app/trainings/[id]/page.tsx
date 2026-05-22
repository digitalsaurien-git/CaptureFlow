"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TrainingDetailsForm } from "@/components/trainings/TrainingDetailsForm";
import { TrainingItemForm } from "@/components/trainings/TrainingItemForm";
import { TrainingItemList } from "@/components/trainings/TrainingItemList";
import type { TrainingItemView } from "@/components/trainings/TrainingItem";

type TrainingDetail = {
  id: string;
  title: string;
  description: string | null;
  totalDurationMinutes: number;
  progressPercent: number;
  items: TrainingItemView[];
};

type TrainingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function TrainingDetailPage({ params }: TrainingDetailPageProps) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [training, setTraining] = useState<TrainingDetail | null>(null);
  const [trainingId, setTrainingId] = useState("");

  useEffect(() => {
    void params.then(({ id }) => setTrainingId(id));
  }, [params]);

  const loadTraining = useCallback(async () => {
    if (!trainingId) {
      return;
    }

    setIsLoading(true);
    setError("");

    const response = await fetch(`/api/trainings/${trainingId}`);

    if (!response.ok) {
      setTraining(null);
      setError("La formation n'a pas pu etre chargee.");
      setIsLoading(false);
      return;
    }

    const data = (await response.json()) as { training: TrainingDetail };
    setTraining(data.training);
    setIsLoading(false);
  }, [trainingId]);

  useEffect(() => {
    void loadTraining();
  }, [loadTraining]);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            CaptureFlow V1
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            {training?.title ?? "Formation"}
          </h1>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link className="rounded px-3 py-2 text-slate-700 hover:bg-white" href="/">
            Capture
          </Link>
          <Link className="rounded px-3 py-2 text-slate-700 hover:bg-white" href="/projects">
            Projets
          </Link>
          <Link className="rounded px-3 py-2 text-slate-700 hover:bg-white" href="/trainings">
            Formations
          </Link>
        </nav>
      </header>

      <div className="py-8">
        {isLoading ? <p className="text-sm text-slate-600">Chargement...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {training ? (
          <div className="space-y-8">
            <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-wrap gap-2 text-sm">
                <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                  {training.totalDurationMinutes} min
                </span>
                <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                  {training.progressPercent}%
                </span>
              </div>
              <TrainingDetailsForm
                description={training.description}
                onChanged={loadTraining}
                title={training.title}
                trainingId={training.id}
              />
            </section>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
              <section>
                <h2 className="text-lg font-semibold text-slate-950">
                  Nouvelle video ou chapitre
                </h2>
                <div className="mt-4 rounded border border-slate-200 bg-white p-5 shadow-sm">
                  <TrainingItemForm onCreated={loadTraining} trainingId={training.id} />
                </div>
              </section>

              <section>
                <h2 className="mb-4 text-lg font-semibold text-slate-950">
                  Videos et chapitres
                </h2>
                <TrainingItemList
                  items={training.items}
                  onChanged={loadTraining}
                  trainingId={training.id}
                />
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
