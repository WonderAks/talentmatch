import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ok, fail, forbidden, dbError } from "@/lib/api";

// Student's own applications with their status history.
export async function GET() {
  const s = await requireRole("student");
  if (!s) return forbidden();
  try {
    const r = await pool.query(
      `SELECT a.application_id, i.internship_id, i.title, c.name AS company, a.status, a.match_score,
              a.applied_at, a.updated_at,
              COALESCE((SELECT json_agg(json_build_object('old', h.old_status, 'new', h.new_status, 'at', h.changed_at)
                                        ORDER BY h.history_id)
                        FROM application_history h WHERE h.application_id = a.application_id), '[]'::json) AS history
       FROM applications a
       JOIN internships i ON i.internship_id = a.internship_id
       JOIN companies c ON c.company_id = i.company_id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [s.id]
    );
    return ok(r.rows);
  } catch (e) {
    return dbError(e);
  }
}

// Apply: one CALL to a stored procedure = one atomic transaction inside PostgreSQL.
export async function POST(req: Request) {
  const session = await requireRole("student");
  if (!session) return forbidden();
  const { internshipId } = (await req.json().catch(() => ({}))) as { internshipId?: number };
  if (!internshipId) return fail("internshipId is required");
  try {
    await pool.query("CALL sp_apply_for_internship($1, $2)", [session.id, internshipId]);
    return ok({ ok: true }, 201);
  } catch (e: any) {
    if (e.code === "23505") return NextResponse.json({ error: "You have already applied" }, { status: 409 });
    return dbError(e); // trigger rules (closed, deadline, full) arrive as P0001 with a clear message
  }
}

// Withdraw an application that has not been decided yet (trigger decrements applicant_count).
export async function DELETE(req: Request) {
  const s = await requireRole("student");
  if (!s) return forbidden();
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return fail("id is required");
  try {
    const r = await pool.query(
      `DELETE FROM applications
       WHERE application_id = $1 AND student_id = $2 AND status IN ('Applied', 'Under Review')`,
      [id, s.id]
    );
    if (!r.rowCount) return fail("Application cannot be withdrawn", 404);
    return ok();
  } catch (e) {
    return dbError(e);
  }
}
