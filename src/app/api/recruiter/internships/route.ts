import { pool } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { refreshInternshipEmbedding } from "@/lib/embeddings";
import { ok, fail, forbidden, dbError } from "@/lib/api";

// Post a new internship: internship row + required skills in ONE transaction, then embed the text.
export async function POST(req: Request) {
  const s = await requireRole("recruiter");
  if (!s) return forbidden();
  const b = await req.json().catch(() => null);
  if (!b) return fail("Invalid request");
  if (!b.title?.trim() || !b.description?.trim()) return fail("Title and description are required");
  if (!["Remote", "On-site", "Hybrid"].includes(b.type)) return fail("Choose a type");
  if (b.deadline && new Date(b.deadline) < new Date(new Date().toDateString())) return fail("Deadline cannot be in the past");
  const skills: { skillId: number; level: string }[] = Array.isArray(b.skills) ? b.skills : [];

  const client = await pool.connect();
  let internshipId: number;
  try {
    await client.query("BEGIN");
    const r = await client.query(
      `INSERT INTO internships (company_id, recruiter_id, title, description, requirements, location, type,
                                stipend, deadline, max_applicants)
       SELECT company_id, recruiter_id, $2, $3, $4, $5, $6, $7, $8, $9
       FROM recruiters WHERE recruiter_id = $1
       RETURNING internship_id`,
      [s.id, b.title.trim(), b.description.trim(), b.requirements || null, b.location || null, b.type,
       b.stipend === "" || b.stipend == null ? null : Number(b.stipend), b.deadline || null,
       b.maxApplicants ? Number(b.maxApplicants) : 100]
    );
    internshipId = r.rows[0].internship_id;
    for (const k of skills) {
      await client.query(
        "INSERT INTO internship_skills (internship_id, skill_id, required_level) VALUES ($1, $2, $3)",
        [internshipId, k.skillId, k.level]
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    return dbError(e);
  } finally {
    client.release();
  }
  const embedded = await refreshInternshipEmbedding(internshipId).catch(() => false);
  return ok({ ok: true, internshipId, embedded }, 201);
}
