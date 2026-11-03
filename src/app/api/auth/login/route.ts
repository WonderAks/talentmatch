import { pool } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { ok, fail, dbError } from "@/lib/api";

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b.email !== "string" || typeof b.password !== "string") return fail("Invalid request");
  const role = b.role === "recruiter" ? "recruiter" : "student";

  try {
    // crypt(password, stored_hash) re-hashes with the stored salt; equal result = correct password
    const sql =
      role === "student"
        ? `SELECT student_id AS id, name FROM students
           WHERE email = $1 AND password_hash = crypt($2, password_hash)`
        : `SELECT recruiter_id AS id, name FROM recruiters
           WHERE email = $1 AND password_hash = crypt($2, password_hash)`;
    const r = await pool.query(sql, [b.email.trim().toLowerCase(), b.password]);
    if (!r.rowCount) return fail("Invalid email or password", 401);
    await createSession({ id: r.rows[0].id, role, name: r.rows[0].name });
    return ok({ ok: true, role });
  } catch (e) {
    return dbError(e);
  }
}
