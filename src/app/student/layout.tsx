import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s || s.role !== "student") redirect("/login");
  return (
    <>
      <Navbar role="student" name={s.name} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
