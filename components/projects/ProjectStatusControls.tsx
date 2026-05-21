"use client";

type ProjectStatusControlsProps = {
  progress: "P0" | "P20" | "P40" | "P60" | "P80" | "P100";
  projectId: string;
  status: "ACTIVE" | "PAUSED" | "DONE" | "ARCHIVED";
  onChanged?: () => void;
};

const projectStatuses = ["ACTIVE", "PAUSED", "DONE", "ARCHIVED"] as const;
const progressSteps = ["P0", "P20", "P40", "P60", "P80", "P100"] as const;

export function ProjectStatusControls({
  progress,
  projectId,
  status,
  onChanged
}: ProjectStatusControlsProps) {
  async function patchProject(payload: { status?: string; progress?: string }) {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      onChanged?.();
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium text-slate-700">
        Statut
        <select
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
          onChange={(event) => void patchProject({ status: event.target.value })}
          value={status}
        >
          {projectStatuses.map((value) => (
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
          onChange={(event) => void patchProject({ progress: event.target.value })}
          value={progress}
        >
          {progressSteps.map((value) => (
            <option key={value} value={value}>
              {value.replace("P", "")}%
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
