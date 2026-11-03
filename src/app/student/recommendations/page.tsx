"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import type { Internship } from "@/lib/types";
import InternshipCard from "@/components/InternshipCard";

export default function RecommendationsPage() {
  const [items, setItems] = useState<Internship[]>([]);
  const [personalised, setPersonalised] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ personalised: boolean; results: Internship[] }>("/api/recommendations")
      .then((r) => { setItems(r.results); setPersonalised(r.personalised); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Recommended for you</h1>
        <p className="text-sm text-gray-600">
          Ranked by semantic similarity between your profile and each internship (pgvector, cosine distance).
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? <p className="text-sm text-gray-500">Loading...</p> : !personalised ? (
        <p className="card text-sm text-gray-600">
          No profile embedding yet. Add resume text and skills in <Link className="underline" href="/student/profile">Profile</Link>, then come back.
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">No open internships to recommend right now.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((i) => <InternshipCard key={i.internship_id} item={i} />)}
        </div>
      )}
    </div>
  );
}
