import { pool } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ok, fail, forbidden, dbError } from "@/lib/api";

// Applicants of one of the recruiter's internships, ranked by semantic similarity (pgvector).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireRole("recruiter");
  if (!s) return forbidden();
  const internshipId = Number((await params).id);
  try {
    const own = await pool.query(
      "SELECT title FROM internships WHERE internship_id = $1 AND recruiter_id = $2",
      [internshipId, s.id]
    );
    if (!own.rowCount) return fail("Internship not found", 404);

    const r = await pool.query(
      `SELECT a.application_id, st.name, st.email, st.department, a.status, a.applied_at, r.similarity,
              COALESCE((SELECT string_agg(sk.name, ', ' ORDER BY sk.name)
                        FROM student_skills ss JOIN skills sk ON sk.skill_id = ss.skill_id
                        WHERE ss.student_id = st.student_id), '') AS skills
       FROM applications a
       JOIN students st ON st.student_id = a.student_id
       LEFT JOIN fn_rank_applicants($1) r ON r.application_id = a.application_id
       WHERE a.internship_id = $1
       ORDER BY r.similarity DESC NULLS LAST, a.applied_at`,
      [internshipId]
    );
    return ok({ title: own.rows[0].title, applicants: r.rows });
  } catch (e) {
    return dbError(e);
  }
}
