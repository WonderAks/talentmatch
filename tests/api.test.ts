import { describe, it, expect } from "vitest";
import { ok, fail, forbidden, dbError } from "../src/lib/api";

describe("API response helpers", () => {
  it("returns a successful response with status 200", async () => {
    const response = ok();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("returns custom data and status", async () => {
    const response = ok({ message: "Success" }, 201);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ message: "Success" });
  });

  it("returns an error response", async () => {
    const response = fail("Invalid input", 400);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid input" });
  });

  it("returns forbidden with status 403", async () => {
    const response = forbidden();
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
  });
});

describe("Database error handling", () => {
  it("handles duplicate email errors", async () => {
    const response = dbError({
      code: "23505",
      constraint: "users_email_key",
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Email is already registered",
    });
  });

  it("handles duplicate record errors", async () => {
    const response = dbError({ code: "23505", constraint: "other_key" });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Already exists" });
  });

  it("handles validation errors", async () => {
    const response = dbError({ code: "23514" });
    expect(response.status).toBe(400);
  });

  it("handles missing referenced records", async () => {
    const response = dbError({ code: "23503" });
    expect(response.status).toBe(400);
  });

  it("handles permission errors", async () => {
    const response = dbError({ code: "42501" });
    expect(response.status).toBe(403);
  });

  it("handles database rule exceptions", async () => {
    const response = dbError({
      code: "P0001",
      message: "Custom database rule",
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Custom database rule",
    });
  });

  it("handles unexpected database errors", async () => {
    const response = dbError({ code: "UNKNOWN" });
    expect(response.status).toBe(500);
  });
  it("uses fallback message when database rule has no message", async () => {
  const response = dbError({ code: "P0001" });
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({
    error: "Rejected by database rule",
    });
  });
});