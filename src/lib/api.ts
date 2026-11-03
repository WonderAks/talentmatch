import { NextResponse } from "next/server";

export const ok = (data: unknown = { ok: true }, status = 200) =>
  NextResponse.json(data, { status });

export const fail = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export const forbidden = () => fail("Forbidden", 403);

/** Translate PostgreSQL errors into safe, user-friendly responses. */
export function dbError(e: unknown) {
  const err = e as { code?: string; message?: string; constraint?: string };
  switch (err.code) {
    case "23505":
      return fail(
        err.constraint?.includes("email") ? "Email is already registered" : "Already exists",
        409
      );
    case "23514":
      return fail("A value failed validation (check email, phone, stipend, dates)", 400);
    case "23503":
      return fail("Referenced record does not exist", 400);
    case "42501":
      return fail("You are not allowed to do that", 403);
    case "P0001": // RAISE EXCEPTION from our triggers / procedures
      return fail(err.message ?? "Rejected by database rule", 400);
    default:
      console.error("DB error:", e);
      return fail("Something went wrong", 500);
  }
}
