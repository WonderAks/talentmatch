import { pool } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ok, fail, forbidden, dbError } from "@/lib/api";

// Open / close an internship (only the recruiter who owns it).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireRole("recruiter");
  if (!s) return forbidden();
  const { id } = await params;
  const { status } = (await req.json().catch(() => ({}))) as { status?: string };
  if (status !== "Open" && status !== "Closed") return fail("Invalid status");
  try {
    const r = await pool.query(
      "UPDATE internships SET status = $1 WHERE internship_id = $2 AND recruiter_id = $3",
      [status, Number(id), s.id]
    );
    if (!r.rowCount) return fail("Internship not found", 404);
    return ok();
  } catch (e) {
    return dbError(e);
  }
}
