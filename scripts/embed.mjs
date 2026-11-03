// scripts/embed.mjs   (run:  node --env-file=.env.local scripts/embed.mjs)
import pg from "pg";
import { pipeline } from "@huggingface/transformers";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

async function embed(text) {
  const out = await extractor(text, { pooling: "mean", normalize: true });
  return "[" + Array.from(out.data).join(",") + "]";      // pgvector text format
}

const students = await pool.query(`
  SELECT s.student_id AS id,
         COALESCE(s.resume_text, '') || ' Skills: ' ||
         COALESCE((SELECT string_agg(sk.name, ', ') FROM student_skills ss
                   JOIN skills sk ON sk.skill_id = ss.skill_id
                   WHERE ss.student_id = s.student_id), '') AS doc
  FROM students s`);
for (const r of students.rows) {
  await pool.query("UPDATE students SET profile_embedding = $1::vector WHERE student_id = $2",
                   [await embed(r.doc), r.id]);
}

const internships = await pool.query(`
  SELECT i.internship_id AS id,
         i.title || '. ' || i.description || ' Requirements: ' || COALESCE(i.requirements, '') ||
         ' Skills: ' || COALESCE((SELECT string_agg(sk.name, ', ') FROM internship_skills isk
                                  JOIN skills sk ON sk.skill_id = isk.skill_id
                                  WHERE isk.internship_id = i.internship_id), '') AS doc
  FROM internships i`);
for (const r of internships.rows) {
  await pool.query("UPDATE internships SET description_embedding = $1::vector WHERE internship_id = $2",
                   [await embed(r.doc), r.id]);
}

await pool.query("UPDATE applications SET match_score = fn_compute_match_score(student_id, internship_id)");
console.log(`Embedded ${students.rowCount} students and ${internships.rowCount} internships`);
await pool.end();
