import { pool } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ok, fail, forbidden, dbError } from "@/lib/api";
import { STATUSES } from "@/lib/types";

// Recruiter moves an application through the pipeline.
// Ownership is verified again INSIDE the database by sp_update_application_status.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireRole("recruiter");
  if (!s) return forbidden();
  const { id } = await params;
  const { status } = (await req.json().catch(() => ({}))) as { status?: string };
  if (!status || !(STATUSES as readonly string[]).includes(status)) return fail("Invalid status");
  try {
    await pool.query("CALL sp_update_application_status($1, $2, $3)", [Number(id), status, s.id]);
    return ok();
  } catch (e) {
    return dbError(e);
  }
}
