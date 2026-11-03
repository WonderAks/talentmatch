import { pool } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { refreshStudentEmbedding } from "@/lib/embeddings";
import { ok, forbidden, dbError } from "@/lib/api";

const QUERY = `SELECT r.internship_id, r.title, r.company, r.similarity,
                      i.location, i.type, i.stipend, i.deadline, i.description, i.requirements,
                      FALSE AS applied,
                      EXISTS (SELECT 1 FROM saved_internships sv WHERE sv.student_id = $1 AND sv.internship_id = r.internship_id) AS saved
               FROM fn_recommend_internships($1, 10) r
               JOIN internships i ON i.internship_id = r.internship_id`;

export async function GET() {
  const s = await requireRole("student");
  if (!s) return forbidden();
  try {
    let r = await pool.query(QUERY, [s.id]);
    // no profile embedding yet -> try to create it once, then query again
    if (r.rows.length && r.rows[0].similarity == null) {
      if (await refreshStudentEmbedding(s.id)) r = await pool.query(QUERY, [s.id]);
    }
    const personalised = r.rows.length > 0 && r.rows[0].similarity != null;
    return ok({ personalised, results: r.rows });
  } catch (e) {
    return dbError(e);
  }
}
