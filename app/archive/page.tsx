import Link from "next/link";
import { CaptureList } from "@/components/CaptureList";

export default function ArchivePage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            CaptureFlow V1
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Archive</h1>
        </div>
        <nav className="flex gap-2 text-sm">
          <Link className="rounded px-3 py-2 text-slate-700 hover:bg-white" href="/">
            Capture
          </Link>
          <Link className="rounded px-3 py-2 text-slate-700 hover:bg-white" href="/inbox">
            Inbox
          </Link>
          <Link className="rounded px-3 py-2 text-slate-700 hover:bg-white" href="/archive">
            Archive
          </Link>
        </nav>
      </header>

      <section className="py-8">
        <CaptureList archived />
      </section>
    </main>
  );
}
