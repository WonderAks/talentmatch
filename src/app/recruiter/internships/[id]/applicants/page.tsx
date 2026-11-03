"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/client";
import ApplicationTable, { type Applicant } from "@/components/ApplicationTable";

export default function ApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<Applicant[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<{ title: string; applicants: Applicant[] }>(`/api/recruiter/internships/${id}/applicants`)
      .then((d) => { setTitle(d.title); setRows(d.applicants); })
      .catch((e) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);

  return (
    <div className="space-y-4">
      <Link href="/recruiter/dashboard" className="text-sm text-indigo-700 underline">&larr; Back to dashboard</Link>
      <h1 className="text-2xl font-bold">Applicants{title ? ` · ${title}` : ""}</h1>
      <p className="text-sm text-gray-600">Ranked by semantic similarity between each candidate&apos;s profile and the internship description.</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : <div className="card"><ApplicationTable rows={rows} onChange={load} /></div>}
    </div>
  );
}
