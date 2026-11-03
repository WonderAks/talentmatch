import { pool } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { refreshStudentEmbedding } from "@/lib/embeddings";
import { ok, fail, forbidden, dbError } from "@/lib/api";

export async function GET() {
  const s = await requireRole("student");
  if (!s) return forbidden();
  try {
    const p = await pool.query(
      "SELECT name, email, phone, department, resume_text FROM students WHERE student_id = $1",
      [s.id]
    );
    const sk = await pool.query(
      `SELECT ss.skill_id, sk.name, ss.proficiency_level
       FROM student_skills ss JOIN skills sk ON sk.skill_id = ss.skill_id
       WHERE ss.student_id = $1 ORDER BY sk.name`,
      [s.id]
    );
    return ok({ ...p.rows[0], skills: sk.rows });
  } catch (e) {
    return dbError(e);
  }
}

// Profile + skills are saved in ONE transaction (all or nothing).
export async function PUT(req: Request) {
  const s = await requireRole("student");
  if (!s) return forbidden();
  const b = await req.json().catch(() => null);
  if (!b || typeof b.name !== "string" || b.name.trim().length < 2) return fail("Enter your name");
  const skills: { skillId: number; level: string }[] = Array.isArray(b.skills) ? b.skills : [];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE students SET name = $1, phone = $2, department = $3, resume_text = $4 WHERE student_id = $5`,
      [b.name.trim(), b.phone || null, b.department || null, b.resume_text || null, s.id]
    );
    await client.query("DELETE FROM student_skills WHERE student_id = $1", [s.id]);
    for (const k of skills) {
      await client.query(
        "INSERT INTO student_skills (student_id, skill_id, proficiency_level) VALUES ($1, $2, $3)",
        [s.id, k.skillId, k.level]
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    return dbError(e);
  } finally {
    client.release();
  }

  // semantic layer: refresh the profile embedding and the cached match scores (best effort)
  try {
    if (await refreshStudentEmbedding(s.id)) {
      await pool.query(
        "UPDATE applications SET match_score = fn_compute_match_score(student_id, internship_id) WHERE student_id = $1",
        [s.id]
      );
    }
  } catch (e) {
    console.error("Embedding refresh failed:", e);
  }
  return ok();
}
