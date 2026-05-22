"use client";

import { useState } from "react";
import {
  TrainingItem,
  type TrainingItemView
} from "@/components/trainings/TrainingItem";

type TrainingItemListProps = {
  items: TrainingItemView[];
  onChanged?: () => void;
  trainingId: string;
};

export function TrainingItemList({ items, onChanged, trainingId }: TrainingItemListProps) {
  const [confirmingItemId, setConfirmingItemId] = useState<string | null>(null);

  async function updateItem(
    itemId: string,
    payload: { progress?: string; isDone?: boolean }
  ) {
    const response = await fetch(`/api/training-items/${itemId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      onChanged?.();
    }
  }

  async function reorder(itemIds: string[]) {
    const response = await fetch(`/api/trainings/${trainingId}/items/reorder`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemIds })
    });

    if (response.ok) {
      onChanged?.();
    }
  }

  async function archiveItem(itemId: string) {
    const response = await fetch(`/api/training-items/${itemId}`, {
      method: "DELETE"
    });

    if (response.ok) {
      setConfirmingItemId(null);
      onChanged?.();
    }
  }

  function moveItem(itemId: string, direction: -1 | 1) {
    const index = items.findIndex((item) => item.id === itemId);

    if (index < 0) {
      return;
    }

    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= items.length) {
      return;
    }

    const reordered = [...items];
    const [item] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, item);

    void reorder(reordered.map((entry) => entry.id));
  }

  if (items.length === 0) {
    return (
      <p className="rounded border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        Aucune video ou chapitre pour cette formation.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <TrainingItem
          canMoveDown={index < items.length - 1}
          canMoveUp={index > 0}
          isConfirmingArchive={confirmingItemId === item.id}
          item={item}
          key={item.id}
          onArchive={(itemId) => void archiveItem(itemId)}
          onCancelArchive={() => setConfirmingItemId(null)}
          onMoveDown={(itemId) => moveItem(itemId, 1)}
          onMoveUp={(itemId) => moveItem(itemId, -1)}
          onRequestArchive={(itemId) => setConfirmingItemId(itemId)}
          onUpdate={(itemId, payload) => void updateItem(itemId, payload)}
        />
      ))}
    </div>
  );
}
