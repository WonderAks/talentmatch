const COLORS: Record<string, string> = {
  Applied: "bg-gray-100 text-gray-700",
  "Under Review": "bg-amber-100 text-amber-800",
  Shortlisted: "bg-blue-100 text-blue-800",
  Selected: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  Open: "bg-green-100 text-green-800",
  Closed: "bg-gray-200 text-gray-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLORS[status] ?? "bg-gray-100"}`}>
      {status}
    </span>
  );
}
