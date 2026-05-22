"use client";

export type TrainingItemView = {
  id: string;
  title: string;
  durationMinutes: number;
  progress: "P0" | "P20" | "P40" | "P60" | "P80" | "P100";
  isDone: boolean;
  position: number;
};

type TrainingItemProps = {
  canMoveDown: boolean;
  canMoveUp: boolean;
  isConfirmingArchive: boolean;
  item: TrainingItemView;
  onArchive: (itemId: string) => void;
  onCancelArchive: () => void;
  onRequestArchive: (itemId: string) => void;
  onMoveDown: (itemId: string) => void;
  onMoveUp: (itemId: string) => void;
  onUpdate: (itemId: string, payload: { progress?: string; isDone?: boolean }) => void;
};

const progressSteps = ["P0", "P20", "P40", "P60", "P80", "P100"] as const;

export function TrainingItem({
  canMoveDown,
  canMoveUp,
  isConfirmingArchive,
  item,
  onArchive,
  onCancelArchive,
  onRequestArchive,
  onMoveDown,
  onMoveUp,
  onUpdate
}: TrainingItemProps) {
  return (
    <article className="rounded border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{item.durationMinutes} min</p>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
          #{item.position + 1}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Progression
          <select
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
            onChange={(event) => onUpdate(item.id, { progress: event.target.value })}
            value={item.progress}
          >
            {progressSteps.map((value) => (
              <option key={value} value={value}>
                {value.replace("P", "")}%
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 pt-7 text-sm font-medium text-slate-700">
          <input
            checked={item.isDone}
            className="h-4 w-4"
            onChange={(event) => onUpdate(item.id, { isDone: event.target.checked })}
            type="checkbox"
          />
          Fait
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          disabled={!canMoveUp}
          onClick={() => onMoveUp(item.id)}
          type="button"
        >
          Monter
        </button>
        <button
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          disabled={!canMoveDown}
          onClick={() => onMoveDown(item.id)}
          type="button"
        >
          Descendre
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
          <p className="text-sm text-red-800">Archiver cette video ou ce chapitre ?</p>
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
