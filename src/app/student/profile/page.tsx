"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type Skill = { skill_id: number; name: string; category: string };
const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];

export default function ProfilePage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", department: "", resume_text: "" });
  const [all, setAll] = useState<Skill[]>([]);
  const [mine, setMine] = useState<Record<number, string>>({});
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api("/api/profile"), api<Skill[]>("/api/skills")]).then(([p, s]) => {
      setForm({ name: p.name ?? "", email: p.email ?? "", phone: p.phone ?? "", department: p.department ?? "", resume_text: p.resume_text ?? "" });
      setMine(Object.fromEntries(p.skills.map((k: any) => [k.skill_id, k.proficiency_level])));
      setAll(s);
    });
  }, []);

  const toggle = (id: number) =>
    setMine((m) => { const n = { ...m }; if (n[id]) delete n[id]; else n[id] = "Beginner"; return n; });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          skills: Object.entries(mine).map(([id, level]) => ({ skillId: Number(id), level })),
        }),
      });
      setMsg({ text: "Profile saved. Your recommendations have been refreshed.", error: false });
    } catch (err) {
      setMsg({ text: (err as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <h1 className="text-2xl font-bold">My profile</h1>
      <div className="card grid gap-4 md:grid-cols-2">
        <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label">Email</label><input className="input bg-gray-100" value={form.email} disabled /></div>
        <div><label className="label">Phone</label><input className="input" placeholder="10-15 digits" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div><label className="label">Department</label><input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
        <div className="md:col-span-2">
          <label className="label">Resume / about you (this text is converted into your profile embedding)</label>
          <textarea rows={5} className="input" value={form.resume_text} onChange={(e) => setForm({ ...form, resume_text: e.target.value })} />
        </div>
      </div>

      <div className="card">
        <h2 className="mb-2 font-semibold">Skills</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {all.map((s) => (
            <div key={s.skill_id} className="flex items-center justify-between gap-2 rounded border p-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={!!mine[s.skill_id]} onChange={() => toggle(s.skill_id)} />
                {s.name} <span className="text-xs text-gray-400">{s.category}</span>
              </label>
              {mine[s.skill_id] && (
                <select className="input !w-auto" value={mine[s.skill_id]} onChange={(e) => setMine({ ...mine, [s.skill_id]: e.target.value })}>
                  {LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>
      {msg && <p className={`text-sm ${msg.error ? "text-red-600" : "text-green-700"}`}>{msg.text}</p>}
      <button className="btn" disabled={busy}>{busy ? "Saving..." : "Save profile"}</button>
    </form>
  );
}
