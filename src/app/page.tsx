import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const s = await getSession();
  if (s) redirect(`/${s.role}/dashboard`);
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold text-indigo-700">TalentMatch</h1>
      <p className="mt-3 text-lg text-gray-600">
        Intelligent internship &amp; skill matching. Semantic search finds internships by meaning, not just keywords.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/login" className="btn">Log in</Link>
        <Link href="/register" className="btn-secondary">Create account</Link>
      </div>
    </main>
  );
}
