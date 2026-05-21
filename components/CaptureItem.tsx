"use client";

import { StatusBadge } from "@/components/StatusBadge";

export type CaptureView = {
  id: string;
  title: string;
  content: string | null;
  source: string | null;
  status: "INBOX" | "TODO" | "DONE" | "ARCHIVED";
  createdAt: string;
};

type CaptureItemProps = {
  capture: CaptureView;
  onChanged?: () => void;
};

export function CaptureItem({ capture, onChanged }: CaptureItemProps) {
  async function updateStatus(status: "INBOX" | "TODO" | "DONE") {
    await fetch(`/api/captures/${capture.id}/status`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    onChanged?.();
  }

  async function archive() {
    await fetch(`/api/captures/${capture.id}/archive`, {
      method: "POST"
    });

    onChanged?.();
  }

  return (
    <article className="rounded border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-950">{capture.title}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {new Date(capture.createdAt).toLocaleString("fr-FR")}
            {capture.source ? ` · ${capture.source}` : ""}
          </p>
        </div>
        <StatusBadge status={capture.status} />
      </div>

      {capture.content ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {capture.content}
        </p>
      ) : null}

      {capture.status !== "ARCHIVED" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => updateStatus("INBOX")}
            type="button"
          >
            Inbox
          </button>
          <button
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => updateStatus("TODO")}
            type="button"
          >
            A faire
          </button>
          <button
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => updateStatus("DONE")}
            type="button"
          >
            Termine
          </button>
          <button
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            onClick={archive}
            type="button"
          >
            Archiver
          </button>
        </div>
      ) : null}
    </article>
  );
}
