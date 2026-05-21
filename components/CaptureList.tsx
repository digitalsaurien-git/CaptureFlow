"use client";

import { useCallback, useEffect, useState } from "react";
import { CaptureItem, type CaptureView } from "@/components/CaptureItem";

type CaptureListProps = {
  archived?: boolean;
  refreshKey?: number;
};

export function CaptureList({ archived = false, refreshKey = 0 }: CaptureListProps) {
  const [captures, setCaptures] = useState<CaptureView[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadCaptures = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const response = await fetch(`/api/captures?archived=${archived ? "true" : "false"}`);

    if (!response.ok) {
      setCaptures([]);
      setError("Les captures n'ont pas pu etre chargees.");
      setIsLoading(false);
      return;
    }

    const data = (await response.json()) as { captures: CaptureView[] };
    setCaptures(data.captures);
    setIsLoading(false);
  }, [archived]);

  useEffect(() => {
    void loadCaptures();
  }, [loadCaptures, refreshKey]);

  if (isLoading) {
    return <p className="text-sm text-slate-600">Chargement...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (captures.length === 0) {
    return (
      <p className="rounded border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        Aucune capture pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {captures.map((capture) => (
        <CaptureItem capture={capture} key={capture.id} onChanged={loadCaptures} />
      ))}
    </div>
  );
}
