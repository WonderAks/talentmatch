import { pool } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ok, forbidden, dbError } from "@/lib/api";

export async function GET() {
  const s = await requireRole("recruiter");
  if (!s) return forbidden();
  try {
    const totals = await pool.query("SELECT * FROM fn_recruiter_dashboard($1)", [s.id]);
    const rows = await pool.query(
      `SELECT v.internship_id, v.title, v.total_applications, v.shortlisted, v.selected, v.avg_match_score,
              i.status, i.deadline, i.applicant_count, i.max_applicants
       FROM v_recruiter_internship_stats v
       JOIN internships i ON i.internship_id = v.internship_id
       WHERE v.recruiter_id = $1
       ORDER BY i.posted_at DESC`,
      [s.id]
    );
    return ok({ totals: totals.rows[0], internships: rows.rows });
  } catch (e) {
    return dbError(e);
  }
}
