"use client";

import Link from "next/link";
import { useState } from "react";
import { CaptureForm } from "@/components/CaptureForm";
import { CaptureList } from "@/components/CaptureList";

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            CaptureFlow V1
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Capture rapide
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

      <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <section>
          <h2 className="text-lg font-semibold text-slate-950">Nouvelle capture</h2>
          <div className="mt-4 rounded border border-slate-200 bg-white p-5 shadow-sm">
            <CaptureForm onCreated={() => setRefreshKey((value) => value + 1)} />
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Dernieres captures</h2>
            <Link className="text-sm font-medium text-slate-700 hover:text-slate-950" href="/inbox">
              Tout voir
            </Link>
          </div>
          <CaptureList refreshKey={refreshKey} />
        </section>
      </div>
    </main>
  );
}
