import { pool } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ok, fail, forbidden, dbError } from "@/lib/api";

export async function GET() {
  const s = await requireRole("student");
  if (!s) return forbidden();
  try {
    const r = await pool.query(
      `SELECT i.internship_id, i.title, c.name AS company, i.location, i.type, i.stipend, i.deadline,
              i.description, i.requirements, TRUE AS saved,
              EXISTS (SELECT 1 FROM applications a WHERE a.student_id = $1 AND a.internship_id = i.internship_id) AS applied
       FROM saved_internships v
       JOIN internships i ON i.internship_id = v.internship_id
       JOIN companies c ON c.company_id = i.company_id
       WHERE v.student_id = $1
       ORDER BY v.saved_at DESC`,
      [s.id]
    );
    return ok(r.rows);
  } catch (e) {
    return dbError(e);
  }
}

export async function POST(req: Request) {
  const s = await requireRole("student");
  if (!s) return forbidden();
  const { internshipId } = (await req.json().catch(() => ({}))) as { internshipId?: number };
  if (!internshipId) return fail("internshipId is required");
  try {
    await pool.query(
      "INSERT INTO saved_internships (student_id, internship_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [s.id, internshipId]
    );
    return ok({ ok: true }, 201);
  } catch (e) {
    return dbError(e);
  }
}

export async function DELETE(req: Request) {
  const s = await requireRole("student");
  if (!s) return forbidden();
  const id = Number(new URL(req.url).searchParams.get("internshipId"));
  if (!id) return fail("internshipId is required");
  try {
    await pool.query("DELETE FROM saved_internships WHERE student_id = $1 AND internship_id = $2", [s.id, id]);
    return ok();
  } catch (e) {
    return dbError(e);
  }
}
