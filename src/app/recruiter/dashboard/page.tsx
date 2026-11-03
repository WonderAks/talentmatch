"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";

type Row = {
  internship_id: number; title: string; total_applications: string; shortlisted: string; selected: string;
  avg_match_score: string | null; status: string; deadline: string | null; applicant_count: number; max_applicants: number;
};
type Data = { totals: { internships_posted: string; total_applications: string; shortlisted: string; selected: string }; internships: Row[] };

export default function RecruiterDashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<Data>("/api/recruiter/dashboard").then(setData).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function toggle(r: Row) {
    try {
      await api(`/api/recruiter/internships/${r.internship_id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: r.status === "Open" ? "Closed" : "Open" }),
      });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recruiter dashboard</h1>
        <Link href="/recruiter/internships/new" className="btn">Post internship</Link>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Internships posted" value={data.totals.internships_posted} />
            <StatCard label="Applications" value={data.totals.total_applications} />
            <StatCard label="Shortlisted" value={data.totals.shortlisted} />
            <StatCard label="Selected" value={data.totals.selected} />
          </div>
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr><th className="p-3">Internship</th><th className="p-3">Status</th><th className="p-3">Applicants</th>
                  <th className="p-3">Shortlisted</th><th className="p-3">Avg match</th><th className="p-3">Deadline</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {data.internships.map((r) => (
                  <tr key={r.internship_id} className="border-b">
                    <td className="p-3 font-medium">{r.title}</td>
                    <td className="p-3"><StatusBadge status={r.status} /></td>
                    <td className="p-3">{r.total_applications} / {r.max_applicants}</td>
                    <td className="p-3">{r.shortlisted}</td>
                    <td className="p-3">{r.avg_match_score != null ? `${Math.round(Number(r.avg_match_score) * 100)}%` : "-"}</td>
                    <td className="p-3">{r.deadline ? String(r.deadline).slice(0, 10) : "-"}</td>
                    <td className="flex gap-2 p-3">
                      <Link className="btn" href={`/recruiter/internships/${r.internship_id}/applicants`}>Applicants</Link>
                      <button className="btn-secondary" onClick={() => toggle(r)}>{r.status === "Open" ? "Close" : "Reopen"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
