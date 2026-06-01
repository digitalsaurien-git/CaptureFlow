"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PriorityCloudItem,
  type PriorityCloudItemView
} from "@/components/priority-cloud/PriorityCloudItem";

type PriorityCloudViewProps = {
  refreshKey?: number;
};

export function PriorityCloudView({ refreshKey = 0 }: PriorityCloudViewProps) {
  const [confirmingItemId, setConfirmingItemId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<PriorityCloudItemView[]>([]);

  const loadItems = useCallback(async () => {
    setError("");
    setIsLoading(true);

    const response = await fetch("/api/priority-cloud");

    if (!response.ok) {
      setItems([]);
      setError("Le nuage prioritaire n'a pas pu etre charge.");
      setIsLoading(false);
      return;
    }

    const data = (await response.json()) as { items: PriorityCloudItemView[] };
    setItems(data.items);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems, refreshKey]);

  async function updateWeight(itemId: string, weight: number) {
    const response = await fetch(`/api/priority-cloud/${itemId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ weight })
    });

    if (!response.ok) {
      setError("Le poids n'a pas pu etre modifie.");
      return;
    }

    await loadItems();
  }

  async function archiveItem(itemId: string) {
    const response = await fetch(`/api/priority-cloud/${itemId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      setError("L'element n'a pas pu etre archive.");
      return;
    }

    setConfirmingItemId(null);
    await loadItems();
  }

  if (isLoading) {
    return <p className="text-sm text-slate-600">Chargement...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <p className="rounded border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        Aucun element dans le nuage pour le moment.
      </p>
    );
  }

  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {items.map((item) => (
          <PriorityCloudItem
            isConfirmingArchive={confirmingItemId === item.id}
            item={item}
            key={item.id}
            onArchive={(itemId) => void archiveItem(itemId)}
            onCancelArchive={() => setConfirmingItemId(null)}
            onChangeWeight={(itemId, weight) => void updateWeight(itemId, weight)}
            onRequestArchive={(itemId) => setConfirmingItemId(itemId)}
          />
        ))}
      </div>
    </div>
  );
}
