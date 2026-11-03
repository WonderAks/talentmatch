import { pool } from "@/lib/db";

// all-MiniLM-L6-v2 -> 384-dimensional, normalised sentence embeddings (runs locally, no API key)
type Extractor = (text: string, opts: { pooling: "mean"; normalize: boolean }) => Promise<{ data: Float32Array }>;
let extractorPromise: Promise<Extractor> | null = null;

async function getExtractor(): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = import("@huggingface/transformers")
      .then((m) => m.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2") as unknown as Promise<Extractor>)
      .catch((e) => {
        extractorPromise = null; // allow a retry on the next request
        throw e;
      });
  }
  return extractorPromise;
}

/** Embed text and return it in pgvector's text format: "[0.1,0.2,...]" */
export async function embed(text: string): Promise<string> {
  const extractor = await getExtractor();
  const out = await extractor(text, { pooling: "mean", normalize: true });
  return "[" + Array.from(out.data).join(",") + "]";
}

/** Like embed(), but returns null instead of throwing (model not downloaded, offline, ...). */
export async function tryEmbed(text: string): Promise<string | null> {
  try {
    return await embed(text);
  } catch (e) {
    console.error("Embedding unavailable:", (e as Error).message);
    return null;
  }
}

export async function refreshStudentEmbedding(studentId: number) {
  const r = await pool.query(
    `SELECT COALESCE(s.resume_text, '') || ' Skills: ' ||
            COALESCE((SELECT string_agg(sk.name, ', ') FROM student_skills ss
                      JOIN skills sk ON sk.skill_id = ss.skill_id
                      WHERE ss.student_id = s.student_id), '') AS doc
     FROM students s WHERE s.student_id = $1`,
    [studentId]
  );
  if (!r.rowCount) return false;
  const vec = await tryEmbed(r.rows[0].doc);
  if (!vec) return false;
  await pool.query("UPDATE students SET profile_embedding = $1::vector WHERE student_id = $2", [vec, studentId]);
  return true;
}

export async function refreshInternshipEmbedding(internshipId: number) {
  const r = await pool.query(
    `SELECT i.title || '. ' || i.description || ' Requirements: ' || COALESCE(i.requirements, '') ||
            ' Skills: ' || COALESCE((SELECT string_agg(sk.name, ', ') FROM internship_skills isk
                                     JOIN skills sk ON sk.skill_id = isk.skill_id
                                     WHERE isk.internship_id = i.internship_id), '') AS doc
     FROM internships i WHERE i.internship_id = $1`,
    [internshipId]
  );
  if (!r.rowCount) return false;
  const vec = await tryEmbed(r.rows[0].doc);
  if (!vec) return false;
  await pool.query("UPDATE internships SET description_embedding = $1::vector WHERE internship_id = $2", [vec, internshipId]);
  return true;
}
