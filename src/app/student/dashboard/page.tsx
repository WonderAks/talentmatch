"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import type { ApplicationRow, Internship } from "@/lib/types";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";

export default function StudentDashboard() {
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [recs, setRecs] = useState<Internship[]>([]);
  const [personalised, setPersonalised] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<ApplicationRow[]>("/api/applications"),
      api<{ personalised: boolean; results: Internship[] }>("/api/recommendations"),
    ])
      .then(([a, r]) => {
        setApps(a);
        setRecs(r.results.slice(0, 3));
        setPersonalised(r.personalised);
      })
      .finally(() => setLoading(false));
  }, []);

  const count = (s: string) => apps.filter((a) => a.status === s).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Student dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Applications" value={apps.length} />
        <StatCard label="Under review" value={count("Under Review")} />
        <StatCard label="Shortlisted" value={count("Shortlisted")} />
        <StatCard label="Selected" value={count("Selected")} />
        <StatCard label="Rejected" value={count("Rejected")} />
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Top matches for you</h2>
          <Link href="/student/recommendations" className="text-sm text-indigo-700 underline">See all</Link>
        </div>
        {loading ? <p className="text-sm text-gray-500">Loading...</p> : !personalised ? (
          <p className="card text-sm text-gray-600">
            Add your resume text and skills in <Link className="underline" href="/student/profile">Profile</Link> to get personalised recommendations.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {recs.map((r) => (
              <div key={r.internship_id} className="card">
                <div className="font-semibold">{r.title}</div>
                <div className="text-sm text-gray-600">{r.company}</div>
                <div className="mt-2 text-sm font-semibold text-indigo-700">{Math.round(Number(r.similarity) * 100)}% match</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Recent applications</h2>
        {apps.length === 0 ? <p className="text-sm text-gray-500">No applications yet.</p> : (
          <div className="card divide-y p-0">
            {apps.slice(0, 5).map((a) => (
              <div key={a.application_id} className="flex items-center justify-between p-3 text-sm">
                <div><span className="font-medium">{a.title}</span> <span className="text-gray-500">· {a.company}</span></div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
