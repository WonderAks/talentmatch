import { pool } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ok, fail, forbidden, dbError } from "@/lib/api";

// Skills an internship requires that the logged-in student does not have yet.
export async function GET(req: Request) {
  const s = await requireRole("student");
  if (!s) return forbidden();
  const internshipId = Number(new URL(req.url).searchParams.get("internshipId"));
  if (!internshipId) return fail("internshipId is required");
  try {
    const r = await pool.query("SELECT * FROM fn_skill_gap($1, $2)", [s.id, internshipId]);
    return ok(r.rows);
  } catch (e) {
    return dbError(e);
  }
}
