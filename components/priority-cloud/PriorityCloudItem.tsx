"use client";

export type PriorityCloudItemView = {
  id: string;
  label: string;
  weight: number;
};

type PriorityCloudItemProps = {
  isConfirmingArchive: boolean;
  item: PriorityCloudItemView;
  onArchive: (itemId: string) => void;
  onCancelArchive: () => void;
  onChangeWeight: (itemId: string, weight: number) => void;
  onRequestArchive: (itemId: string) => void;
};

const weightClassNames: Record<number, string> = {
  1: "text-sm",
  2: "text-base",
  3: "text-xl",
  4: "text-2xl",
  5: "text-4xl"
};

export function PriorityCloudItem({
  isConfirmingArchive,
  item,
  onArchive,
  onCancelArchive,
  onChangeWeight,
  onRequestArchive
}: PriorityCloudItemProps) {
  const canDecrease = item.weight > 1;
  const canIncrease = item.weight < 5;
  const labelSizeClassName = weightClassNames[item.weight] ?? weightClassNames[3];

  return (
    <article className="max-w-full rounded border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`${labelSizeClassName} max-w-full break-words font-semibold leading-tight text-slate-950`}
        >
          {item.label}
        </span>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
          poids {item.weight}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          aria-label={`Diminuer ${item.label}`}
          className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          disabled={!canDecrease}
          onClick={() => onChangeWeight(item.id, item.weight - 1)}
          type="button"
        >
          -
        </button>
        <button
          aria-label={`Augmenter ${item.label}`}
          className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          disabled={!canIncrease}
          onClick={() => onChangeWeight(item.id, item.weight + 1)}
          type="button"
        >
          +
        </button>
        <button
          className="rounded border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          onClick={() => onRequestArchive(item.id)}
          type="button"
        >
          Archiver
        </button>
      </div>

      {isConfirmingArchive ? (
        <div className="mt-3 rounded border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">Archiver cet element ?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              className="rounded bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
              onClick={() => onArchive(item.id)}
              type="button"
            >
              Oui, archiver
            </button>
            <button
              className="rounded border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              onClick={onCancelArchive}
              type="button"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
