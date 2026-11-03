"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { ApplicationRow } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

export default function ApplicationsPage() {
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<ApplicationRow[]>("/api/applications").then(setApps).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function withdraw(id: number) {
    if (!confirm("Withdraw this application?")) return;
    try {
      await api(`/api/applications?id=${id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My applications</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {apps.length === 0 ? <p className="text-sm text-gray-500">You have not applied to any internship yet.</p> : (
        <div className="card divide-y p-0">
          {apps.map((a) => (
            <div key={a.application_id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-sm text-gray-600">{a.company} · applied {a.applied_at.slice(0, 10)}</div>
                </div>
                <div className="flex items-center gap-3">
                  {a.match_score != null && <span className="text-sm font-semibold text-indigo-700">{Math.round(Number(a.match_score) * 100)}% match</span>}
                  <StatusBadge status={a.status} />
                  <button className="btn-secondary" onClick={() => setOpen(open === a.application_id ? null : a.application_id)}>
                    {open === a.application_id ? "Hide history" : "History"}
                  </button>
                  {["Applied", "Under Review"].includes(a.status) && (
                    <button className="btn-danger" onClick={() => withdraw(a.application_id)}>Withdraw</button>
                  )}
                </div>
              </div>
              {open === a.application_id && (
                <ol className="mt-3 space-y-1 border-l-2 border-indigo-200 pl-4 text-sm">
                  {a.history.map((h, k) => (
                    <li key={k}>
                      <span className="text-gray-500">{String(h.at).replace("T", " ").slice(0, 16)}</span>{" "}
                      {h.old ? <>{h.old} → <b>{h.new}</b></> : <>Submitted as <b>{h.new}</b></>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
