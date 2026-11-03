"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/client";

type Props = { role: "student" | "recruiter"; name: string };

const LINKS = {
  student: [
    ["/student/dashboard", "Dashboard"],
    ["/student/internships", "Internships"],
    ["/student/recommendations", "Recommended"],
    ["/student/applications", "My applications"],
    ["/student/profile", "Profile"],
  ],
  recruiter: [
    ["/recruiter/dashboard", "Dashboard"],
    ["/recruiter/internships/new", "Post internship"],
  ],
} as const;

export default function Navbar({ role, name }: Props) {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <span className="text-lg font-bold text-indigo-700">TalentMatch</span>
        <nav className="flex flex-1 flex-wrap gap-4 text-sm">
          {LINKS[role].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={path === href ? "font-semibold text-indigo-700" : "text-gray-600 hover:text-gray-900"}
            >
              {label}
            </Link>
          ))}
        </nav>
        <span className="text-sm text-gray-500">
          {name} <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs capitalize">{role}</span>
        </span>
        <button onClick={logout} className="btn-secondary">Log out</button>
      </div>
    </header>
  );
}
