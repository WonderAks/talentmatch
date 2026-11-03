"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import type { Internship } from "@/lib/types";

type Props = { item: Internship; onChange?: () => void };

export default function InternshipCard({ item, onChange }: Props) {
  const [applied, setApplied] = useState(!!item.applied);
  const [saved, setSaved] = useState(!!item.saved);
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [gap, setGap] = useState<{ skill_name: string; required_level: string }[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function apply() {
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/applications", { method: "POST", body: JSON.stringify({ internshipId: item.internship_id }) });
      setApplied(true);
      setSaved(false);
      setMsg({ text: "Application submitted", error: false });
      onChange?.();
    } catch (e) {
      setMsg({ text: (e as Error).message, error: true });
    } finally {
      setBusy(false);
    }
  }

  async function toggleSave() {
    try {
      if (saved) await api(`/api/saved?internshipId=${item.internship_id}`, { method: "DELETE" });
      else await api("/api/saved", { method: "POST", body: JSON.stringify({ internshipId: item.internship_id }) });
      setSaved(!saved);
      onChange?.();
    } catch (e) {
      setMsg({ text: (e as Error).message, error: true });
    }
  }

  async function showGap() {
    if (gap) return setGap(null);
    try {
      setGap(await api(`/api/skill-gap?internshipId=${item.internship_id}`));
    } catch (e) {
      setMsg({ text: (e as Error).message, error: true });
    }
  }

  const match = item.similarity != null ? Math.round(Number(item.similarity) * 100) : null;

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-sm text-gray-600">{item.company}</p>
        </div>
        {match !== null && (
          <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800">
            {match}% match
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
        {item.location && <span className="rounded bg-gray-100 px-2 py-0.5">{item.location}</span>}
        {item.type && <span className="rounded bg-gray-100 px-2 py-0.5">{item.type}</span>}
        {item.stipend && <span className="rounded bg-gray-100 px-2 py-0.5">Stipend {Number(item.stipend).toLocaleString()}</span>}
        {item.deadline && <span className="rounded bg-gray-100 px-2 py-0.5">Apply by {String(item.deadline).slice(0, 10)}</span>}
      </div>
      {item.description && <p className="mt-2 line-clamp-3 text-sm text-gray-700">{item.description}</p>}

      {gap && (
        <div className="mt-2 rounded bg-amber-50 p-2 text-sm">
          {gap.length === 0 ? (
            <span className="text-green-700">You have every required skill.</span>
          ) : (
            <>
              <span className="font-medium">Skills to learn: </span>
              {gap.map((g) => `${g.skill_name} (${g.required_level})`).join(", ")}
            </>
          )}
        </div>
      )}
      {msg && <p className={`mt-2 text-sm ${msg.error ? "text-red-600" : "text-green-700"}`}>{msg.text}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn" disabled={applied || busy} onClick={apply}>
          {applied ? "Applied" : "Apply"}
        </button>
        <button className="btn-secondary" onClick={toggleSave}>{saved ? "Unsave" : "Save"}</button>
        <button className="btn-secondary" onClick={showGap}>{gap ? "Hide skill gap" : "Skill gap"}</button>
      </div>
    </div>
  );
}
