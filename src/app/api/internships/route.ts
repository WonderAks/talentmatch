import { pool } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ok, forbidden, dbError } from "@/lib/api";

// Browse open internships with keyword (full-text) search and filters.
export async function GET(req: Request) {
  const s = await requireRole("student");
  if (!s) return forbidden();
  const p = new URL(req.url).searchParams;
  const q = p.get("q")?.trim() || null;
  const location = p.get("location")?.trim() || null;
  const type = p.get("type") || null;
  const minStipend = p.get("minStipend") ? Number(p.get("minStipend")) : null;

  try {
    const r = await pool.query(
      `SELECT v.internship_id, v.title, v.company, v.location, v.type, v.stipend, v.deadline, v.seats_left,
              i.description, i.requirements,
              EXISTS (SELECT 1 FROM applications a WHERE a.student_id = $1 AND a.internship_id = v.internship_id) AS applied,
              EXISTS (SELECT 1 FROM saved_internships sv WHERE sv.student_id = $1 AND sv.internship_id = v.internship_id) AS saved
       FROM v_open_internships v
       JOIN internships i ON i.internship_id = v.internship_id
       WHERE ($2::text IS NULL OR to_tsvector('english', i.title || ' ' || i.description) @@ plainto_tsquery('english', $2))
         AND ($3::text IS NULL OR v.location ILIKE '%' || $3 || '%')
         AND ($4::text IS NULL OR v.type = $4)
         AND ($5::numeric IS NULL OR v.stipend >= $5)
       ORDER BY v.deadline NULLS LAST
       LIMIT 50`,
      [s.id, q, location, type, minStipend]
    );
    return ok({ mode: "keyword", results: r.rows });
  } catch (e) {
    return dbError(e);
  }
}
