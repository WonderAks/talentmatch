"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "recruiter">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ role, email, password }) });
      router.push(`/${role}/dashboard`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="mb-1 text-2xl font-bold text-indigo-700">TalentMatch</h1>
      <p className="mb-6 text-sm text-gray-600">Log in to continue</p>
      <form onSubmit={submit} className="card space-y-4">
        <div className="flex rounded-md bg-gray-100 p-1 text-sm">
          {(["student", "recruiter"] as const).map((r) => (
            <button type="button" key={r} onClick={() => setRole(r)}
              className={`flex-1 rounded px-3 py-1.5 capitalize ${role === r ? "bg-white font-semibold shadow-sm" : "text-gray-600"}`}>
              {r}
            </button>
          ))}
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? "Logging in..." : "Log in"}</button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        New here? <Link href="/register" className="text-indigo-700 underline">Create an account</Link>
      </p>
    </main>
  );
}
