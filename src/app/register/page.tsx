"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "recruiter">("student");
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "", designation: "", companyId: "" });
  const [companies, setCompanies] = useState<{ company_id: number; name: string }[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api("/api/companies").then(setCompanies).catch(() => {});
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ role, ...form, companyId: form.companyId ? Number(form.companyId) : null }),
      });
      router.push(`/${role}/dashboard`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-indigo-700">Create your account</h1>
      <form onSubmit={submit} className="card mt-4 space-y-4">
        <div className="flex rounded-md bg-gray-100 p-1 text-sm">
          {(["student", "recruiter"] as const).map((r) => (
            <button type="button" key={r} onClick={() => setRole(r)}
              className={`flex-1 rounded px-3 py-1.5 capitalize ${role === r ? "bg-white font-semibold shadow-sm" : "text-gray-600"}`}>
              {r}
            </button>
          ))}
        </div>
        <div><label className="label">Full name</label><input required className="input" value={form.name} onChange={set("name")} /></div>
        <div><label className="label">Email</label><input type="email" required className="input" value={form.email} onChange={set("email")} /></div>
        <div>
          <label className="label">Password (min 8 characters)</label>
          <input type="password" required minLength={8} className="input" value={form.password} onChange={set("password")} />
        </div>
        {role === "student" ? (
          <div><label className="label">Department</label><input className="input" placeholder="CSE" value={form.department} onChange={set("department")} /></div>
        ) : (
          <>
            <div>
              <label className="label">Company</label>
              <select required className="input" value={form.companyId} onChange={set("companyId")}>
                <option value="">Select your company</option>
                {companies.map((c) => <option key={c.company_id} value={c.company_id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="label">Designation</label><input className="input" value={form.designation} onChange={set("designation")} /></div>
          </>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? "Creating..." : "Create account"}</button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Already registered? <Link href="/login" className="text-indigo-700 underline">Log in</Link>
      </p>
    </main>
  );
}
