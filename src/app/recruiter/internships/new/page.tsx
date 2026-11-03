"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

type Skill = { skill_id: number; name: string };
const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

export default function NewInternshipPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", description: "", requirements: "", location: "", type: "Remote", stipend: "", deadline: "", maxApplicants: "50",
  });
  const [all, setAll] = useState<Skill[]>([]);
  const [req, setReq] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { api<Skill[]>("/api/skills").then(setAll); }, []);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });
  const toggle = (id: number) =>
    setReq((m) => { const n = { ...m }; if (n[id]) delete n[id]; else n[id] = "Intermediate"; return n; });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/recruiter/internships", {
        method: "POST",
        body: JSON.stringify({ ...form, skills: Object.entries(req).map(([id, level]) => ({ skillId: Number(id), level })) }),
      });
      router.push("/recruiter/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-bold">Post a new internship</h1>
      <div className="card grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><label className="label">Title</label><input required className="input" value={form.title} onChange={set("title")} /></div>
        <div className="md:col-span-2"><label className="label">Description (converted into the internship embedding)</label>
          <textarea required rows={4} className="input" value={form.description} onChange={set("description")} /></div>
        <div className="md:col-span-2"><label className="label">Requirements</label><input className="input" value={form.requirements} onChange={set("requirements")} /></div>
        <div><label className="label">Location</label><input className="input" value={form.location} onChange={set("location")} /></div>
        <div><label className="label">Type</label>
          <select className="input" value={form.type} onChange={set("type")}><option>Remote</option><option>On-site</option><option>Hybrid</option></select></div>
        <div><label className="label">Stipend</label><input type="number" min={0} className="input" value={form.stipend} onChange={set("stipend")} /></div>
        <div><label className="label">Application deadline</label><input type="date" className="input" value={form.deadline} onChange={set("deadline")} /></div>
        <div><label className="label">Max applicants</label><input type="number" min={1} className="input" value={form.maxApplicants} onChange={set("maxApplicants")} /></div>
      </div>
      <div className="card">
        <h2 className="mb-2 font-semibold">Required skills</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {all.map((s) => (
            <div key={s.skill_id} className="flex items-center justify-between gap-2 rounded border p-2 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!req[s.skill_id]} onChange={() => toggle(s.skill_id)} />{s.name}</label>
              {req[s.skill_id] && (
                <select className="input !w-auto" value={req[s.skill_id]} onChange={(e) => setReq({ ...req, [s.skill_id]: e.target.value })}>
                  {LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? "Posting..." : "Post internship"}</button>
    </form>
  );
}
