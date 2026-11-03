"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Internship } from "@/lib/types";
import InternshipCard from "@/components/InternshipCard";

export default function InternshipsPage() {
  const [tab, setTab] = useState<"browse" | "saved">("browse");
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [minStipend, setMinStipend] = useState("");
  const [semantic, setSemantic] = useState(false);
  const [items, setItems] = useState<Internship[]>([]);
  const [mode, setMode] = useState("keyword");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "saved") {
        setItems(await api<Internship[]>("/api/saved"));
        setMode("saved");
      } else if (semantic && q.trim()) {
        const r = await api<{ mode: string; results: Internship[] }>(`/api/internships/search?q=${encodeURIComponent(q)}`);
        setItems(r.results);
        setMode(r.mode);
      } else {
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        if (location) p.set("location", location);
        if (type) p.set("type", type);
        if (minStipend) p.set("minStipend", minStipend);
        const r = await api<{ mode: string; results: Internship[] }>(`/api/internships?${p}`);
        setItems(r.results);
        setMode(r.mode);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [tab, q, location, type, minStipend, semantic]);

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Internships</h1>
        <div className="flex rounded-md bg-gray-200 p-1 text-sm">
          {(["browse", "saved"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded px-3 py-1 capitalize ${tab === t ? "bg-white font-semibold shadow-sm" : "text-gray-600"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "browse" && (
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="card grid gap-3 md:grid-cols-6">
          <input className="input md:col-span-2" placeholder={semantic ? "Describe what you want to do..." : "Search keywords"} value={q} onChange={(e) => setQ(e.target.value)} />
          <input className="input" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} disabled={semantic} />
          <select className="input" value={type} onChange={(e) => setType(e.target.value)} disabled={semantic}>
            <option value="">Any type</option><option>Remote</option><option>On-site</option><option>Hybrid</option>
          </select>
          <input className="input" type="number" min={0} placeholder="Min stipend" value={minStipend} onChange={(e) => setMinStipend(e.target.value)} disabled={semantic} />
          <button className="btn">Search</button>
          <label className="flex items-center gap-2 text-sm md:col-span-6">
            <input type="checkbox" checked={semantic} onChange={(e) => setSemantic(e.target.checked)} />
            Semantic search (finds internships by meaning using vector similarity)
          </label>
        </form>
      )}

      {mode === "keyword-fallback" && (
        <p className="rounded bg-amber-50 p-2 text-sm text-amber-800">
          The embedding model is not available on the server, so keyword search was used instead.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? <p className="text-sm text-gray-500">Loading...</p> : items.length === 0 ? (
        <p className="text-sm text-gray-500">{tab === "saved" ? "No saved internships." : "No internships match your search."}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((i) => <InternshipCard key={i.internship_id + mode} item={i} onChange={tab === "saved" ? load : undefined} />)}
        </div>
      )}
    </div>
  );
}
