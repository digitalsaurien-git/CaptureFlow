"use client";

import Link from "next/link";
import { useState } from "react";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectList } from "@/components/projects/ProjectList";

export default function ProjectsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            CaptureFlow V1
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Projets</h1>
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

      <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <section>
          <h2 className="text-lg font-semibold text-slate-950">Nouveau projet</h2>
          <div className="mt-4 rounded border border-slate-200 bg-white p-5 shadow-sm">
            <ProjectForm onCreated={() => setRefreshKey((value) => value + 1)} />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Projets actifs</h2>
          <ProjectList refreshKey={refreshKey} />
        </section>
      </div>
    </main>
  );
}
