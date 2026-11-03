import { pool } from "@/lib/db";
import { ok, dbError } from "@/lib/api";

// Public: used by the registration form so a recruiter can pick their company.
export async function GET() {
  try {
    const r = await pool.query("SELECT company_id, name FROM companies ORDER BY name");
    return ok(r.rows);
  } catch (e) {
    return dbError(e);
  }
}
