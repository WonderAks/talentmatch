import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export default async function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s || s.role !== "recruiter") redirect("/login");
  return (
    <>
      <Navbar role="recruiter" name={s.name} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
