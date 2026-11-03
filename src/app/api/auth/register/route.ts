import { pool } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { ok, fail, dbError } from "@/lib/api";

const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b) return fail("Invalid request");
  const { role, name, email, password } = b;
  if (role !== "student" && role !== "recruiter") return fail("Choose a role");
  if (typeof name !== "string" || name.trim().length < 2 || name.length > 100) return fail("Enter your name");
  if (typeof email !== "string" || !EMAIL.test(email)) return fail("Enter a valid email");
  if (typeof password !== "string" || password.length < 8) return fail("Password must be at least 8 characters");

  try {
    let id: number;
    if (role === "student") {
      // the password is hashed inside PostgreSQL (bcrypt, cost 10) - plain text is never stored
      const r = await pool.query(
        `INSERT INTO students (name, email, password_hash, department)
         VALUES ($1, $2, crypt($3, gen_salt('bf', 10)), $4) RETURNING student_id AS id`,
        [name.trim(), email.trim().toLowerCase(), password, b.department || null]
      );
      id = r.rows[0].id;
    } else {
      if (!b.companyId) return fail("Choose your company");
      const r = await pool.query(
        `INSERT INTO recruiters (company_id, name, email, password_hash, designation)
         VALUES ($1, $2, $3, crypt($4, gen_salt('bf', 10)), $5) RETURNING recruiter_id AS id`,
        [b.companyId, name.trim(), email.trim().toLowerCase(), password, b.designation || null]
      );
      id = r.rows[0].id;
    }
    await createSession({ id, role, name: name.trim() });
    return ok({ ok: true, role });
  } catch (e) {
    return dbError(e);
  }
}
