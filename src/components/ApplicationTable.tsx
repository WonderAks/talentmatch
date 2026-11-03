"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { STATUSES } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

export type Applicant = {
  application_id: number;
  name: string;
  email: string;
  department: string | null;
  skills: string;
  status: string;
  similarity: string | null;
  applied_at: string;
};

export default function ApplicationTable({ rows, onChange }: { rows: Applicant[]; onChange: () => void }) {
  const [error, setError] = useState("");

  async function setStatus(id: number, status: string) {
    setError("");
    try {
      await api(`/api/applications/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!rows.length) return <p className="text-sm text-gray-500">No applications yet.</p>;

  return (
    <div className="overflow-x-auto">
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="p-2">#</th><th className="p-2">Candidate</th><th className="p-2">Skills</th>
            <th className="p-2">Match</th><th className="p-2">Status</th><th className="p-2">Change status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.application_id} className="border-b align-top">
              <td className="p-2">{i + 1}</td>
              <td className="p-2">
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-gray-500">{r.email}{r.department ? ` · ${r.department}` : ""}</div>
              </td>
              <td className="p-2 text-xs text-gray-600">{r.skills || "-"}</td>
              <td className="p-2 font-semibold text-indigo-700">
                {r.similarity != null ? `${Math.round(Number(r.similarity) * 100)}%` : "-"}
              </td>
              <td className="p-2"><StatusBadge status={r.status} /></td>
              <td className="p-2">
                <select className="input !w-auto" value={r.status} onChange={(e) => setStatus(r.application_id, e.target.value)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
