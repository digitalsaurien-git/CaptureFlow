"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProjectStatusControls } from "@/components/projects/ProjectStatusControls";
import { TaskForm } from "@/components/projects/TaskForm";
import { TaskList } from "@/components/projects/TaskList";
import type { TaskView } from "@/components/projects/TaskItem";

type ProjectDetail = {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "PAUSED" | "DONE" | "ARCHIVED";
  progress: "P0" | "P20" | "P40" | "P60" | "P80" | "P100";
  tasks: TaskView[];
};

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void params.then(({ id }) => setProjectId(id));
  }, [params]);

  const loadProject = useCallback(async () => {
    if (!projectId) {
      return;
    }

    setIsLoading(true);
    setError("");

    const response = await fetch(`/api/projects/${projectId}`);

    if (!response.ok) {
      setProject(null);
      setError("Le projet n'a pas pu etre charge.");
      setIsLoading(false);
      return;
    }

    const data = (await response.json()) as { project: ProjectDetail };
    setProject(data.project);
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            CaptureFlow V1
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            {project?.title ?? "Projet"}
          </h1>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link className="rounded px-3 py-2 text-slate-700 hover:bg-white" href="/">
            Capture
          </Link>
          <Link className="rounded px-3 py-2 text-slate-700 hover:bg-white" href="/projects">
            Projets
          </Link>
          <Link className="rounded px-3 py-2 text-slate-700 hover:bg-white" href="/inbox">
            Inbox
          </Link>
          <Link className="rounded px-3 py-2 text-slate-700 hover:bg-white" href="/archive">
            Archive
          </Link>
        </nav>
      </header>

      <div className="py-8">
        {isLoading ? <p className="text-sm text-slate-600">Chargement...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {project ? (
          <div className="space-y-8">
            <section className="rounded border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-950">{project.title}</h2>
                {project.description ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {project.description}
                  </p>
                ) : null}
              </div>
              <ProjectStatusControls
                onChanged={loadProject}
                progress={project.progress}
                projectId={project.id}
                status={project.status}
              />
            </section>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
              <section>
                <h2 className="text-lg font-semibold text-slate-950">Nouvelle tache</h2>
                <div className="mt-4 rounded border border-slate-200 bg-white p-5 shadow-sm">
                  <TaskForm onCreated={loadProject} projectId={project.id} />
                </div>
              </section>

              <section>
                <h2 className="mb-4 text-lg font-semibold text-slate-950">Taches</h2>
                <TaskList onChanged={loadProject} projectId={project.id} tasks={project.tasks} />
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
