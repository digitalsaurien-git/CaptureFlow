"use client";

export type TaskView = {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "DOING" | "DONE" | "ARCHIVED";
  progress: "P0" | "P20" | "P40" | "P60" | "P80" | "P100";
  position: number;
};

type TaskItemProps = {
  canMoveDown: boolean;
  canMoveUp: boolean;
  onArchive: (taskId: string) => void;
  onMoveDown: (taskId: string) => void;
  onMoveUp: (taskId: string) => void;
  onUpdate: (taskId: string, payload: { status?: string; progress?: string }) => void;
  task: TaskView;
};

const taskStatuses = ["TODO", "DOING", "DONE", "ARCHIVED"] as const;
const progressSteps = ["P0", "P20", "P40", "P60", "P80", "P100"] as const;

export function TaskItem({
  canMoveDown,
  canMoveUp,
  onArchive,
  onMoveDown,
  onMoveUp,
  onUpdate,
  task
}: TaskItemProps) {
  return (
    <article className="rounded border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{task.title}</h3>
          {task.description ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {task.description}
            </p>
          ) : null}
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
          #{task.position + 1}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Statut
          <select
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
            onChange={(event) => onUpdate(task.id, { status: event.target.value })}
            value={task.status}
          >
            {taskStatuses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Progression
          <select
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
            onChange={(event) => onUpdate(task.id, { progress: event.target.value })}
            value={task.progress}
          >
            {progressSteps.map((value) => (
              <option key={value} value={value}>
                {value.replace("P", "")}%
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          disabled={!canMoveUp}
          onClick={() => onMoveUp(task.id)}
          type="button"
        >
          Monter
        </button>
        <button
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          disabled={!canMoveDown}
          onClick={() => onMoveDown(task.id)}
          type="button"
        >
          Descendre
        </button>
        <button
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          onClick={() => onArchive(task.id)}
          type="button"
        >
          Archiver
        </button>
      </div>
    </article>
  );
}
