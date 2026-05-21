"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type ProjectView = {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "PAUSED" | "DONE" | "ARCHIVED";
  progress: "P0" | "P20" | "P40" | "P60" | "P80" | "P100";
  updatedAt: string;
};

type ProjectListProps = {
  refreshKey?: number;
};

const statusLabels = {
  ACTIVE: "Actif",
  PAUSED: "Pause",
  DONE: "Termine",
  ARCHIVED: "Archive"
};

export function ProjectList({ refreshKey = 0 }: ProjectListProps) {
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const response = await fetch("/api/projects");

    if (!response.ok) {
      setProjects([]);
      setError("Les projets n'ont pas pu etre charges.");
      setIsLoading(false);
      return;
    }

    const data = (await response.json()) as { projects: ProjectView[] };
    setProjects(data.projects);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects, refreshKey]);

  async function archiveProject(projectId: string) {
    if (!window.confirm("Archiver ce projet ?")) {
      return;
    }

    const response = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      setError("Le projet n'a pas pu etre archive.");
      return;
    }

    await loadProjects();
  }

  if (isLoading) {
    return <p className="text-sm text-slate-600">Chargement...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (projects.length === 0) {
    return (
      <p className="rounded border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        Aucun projet actif pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <article className="rounded border border-slate-200 bg-white p-4 shadow-sm" key={project.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">{project.title}</h2>
              {project.description ? (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {project.description}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">
                Mis a jour le {new Date(project.updatedAt).toLocaleString("fr-FR")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                {statusLabels[project.status]}
              </span>
              <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                {project.progress.replace("P", "")}%
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              className="rounded bg-slate-950 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              href={`/projects/${project.id}`}
            >
              Ouvrir
            </Link>
            <button
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => void archiveProject(project.id)}
              type="button"
            >
              Archiver
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
