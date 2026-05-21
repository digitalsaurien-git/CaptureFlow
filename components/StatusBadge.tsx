type StatusBadgeProps = {
  status: "INBOX" | "TODO" | "DONE" | "ARCHIVED";
};

const labels = {
  INBOX: "Inbox",
  TODO: "A faire",
  DONE: "Termine",
  ARCHIVED: "Archive"
};

const styles = {
  INBOX: "bg-blue-50 text-blue-700 ring-blue-200",
  TODO: "bg-amber-50 text-amber-700 ring-amber-200",
  DONE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ARCHIVED: "bg-slate-100 text-slate-600 ring-slate-200"
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ring-1 ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
