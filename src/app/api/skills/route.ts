import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ok, forbidden, dbError } from "@/lib/api";

export async function GET() {
  if (!(await getSession())) return forbidden();
  try {
    const r = await pool.query("SELECT skill_id, name, category FROM skills ORDER BY category, name");
    return ok(r.rows);
  } catch (e) {
    return dbError(e);
  }
}
