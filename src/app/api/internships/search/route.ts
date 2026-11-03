import { pool } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { embed } from "@/lib/embeddings";
import { ok, fail, forbidden, dbError } from "@/lib/api";

// Semantic search: embed the typed text and rank internships by cosine similarity (pgvector).
// Falls back to full-text search if the embedding model is not available.
export async function GET(req: Request) {
  const s = await requireRole("student");
  if (!s) return forbidden();
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return fail("q is required");

  const flags = `EXISTS (SELECT 1 FROM applications a WHERE a.student_id = $1 AND a.internship_id = i.internship_id) AS applied,
                 EXISTS (SELECT 1 FROM saved_internships sv WHERE sv.student_id = $1 AND sv.internship_id = i.internship_id) AS saved`;
  try {
    let vec: string | null = null;
    try {
      vec = await embed(q);
    } catch (e) {
      console.error("Embedding unavailable, using keyword fallback:", (e as Error).message);
    }

    if (vec) {
      const r = await pool.query(
        `SELECT i.internship_id, i.title, c.name AS company, i.location, i.type, i.stipend, i.deadline,
                i.description, i.requirements,
                ROUND((1 - (i.description_embedding <=> $2::vector))::numeric, 4) AS similarity, ${flags}
         FROM internships i JOIN companies c ON c.company_id = i.company_id
         WHERE i.status = 'Open' AND (i.deadline IS NULL OR i.deadline >= CURRENT_DATE)
           AND i.description_embedding IS NOT NULL
         ORDER BY i.description_embedding <=> $2::vector
         LIMIT 10`,
        [s.id, vec]
      );
      return ok({ mode: "semantic", results: r.rows });
    }

    const r = await pool.query(
      `SELECT i.internship_id, i.title, c.name AS company, i.location, i.type, i.stipend, i.deadline,
              i.description, i.requirements, ${flags}
       FROM internships i JOIN companies c ON c.company_id = i.company_id
       WHERE i.status = 'Open' AND (i.deadline IS NULL OR i.deadline >= CURRENT_DATE)
         AND to_tsvector('english', i.title || ' ' || i.description) @@ plainto_tsquery('english', $2)
       LIMIT 10`,
      [s.id, q]
    );
    return ok({ mode: "keyword-fallback", results: r.rows });
  } catch (e) {
    return dbError(e);
  }
}
