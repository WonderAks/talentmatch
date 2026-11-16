import { beforeEach, describe, it, expect, vi } from "vitest";

const store = vi.hoisted(() => {
  const state: { value: string | undefined } = { value: undefined };

  return {
    state,
    set: vi.fn((_name: string, token: string) => {
      state.value = token;
    }),
    get: vi.fn((_name: string) =>
      state.value ? { value: state.value } : undefined
    ),
    delete: vi.fn(() => {
      state.value = undefined;
    }),
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => store),
}));

import {
  createSession,
  getSession,
  clearSession,
  requireRole,
} from "../src/lib/auth";

describe("Authentication", () => {
  beforeEach(() => {
    store.state.value = undefined;
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret-at-least-32-characters-long";
  });

  it("creates a session cookie", async () => {
    await createSession({
      id: 1,
      role: "student",
      name: "Test Student",
    });

    expect(store.set).toHaveBeenCalledOnce();
    expect(store.set.mock.calls[0][0]).toBe("tm_session");
    expect(store.set.mock.calls[0][2]).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 28800,
    });
  });

  it("retrieves a valid student session", async () => {
    await createSession({
      id: 1,
      role: "student",
      name: "Test Student",
    });

    await expect(getSession()).resolves.toEqual({
      id: 1,
      role: "student",
      name: "Test Student",
    });
  });

  it("returns null when no session cookie exists", async () => {
    await expect(getSession()).resolves.toBeNull();
  });

  it("returns null for an invalid token", async () => {
    store.state.value = "invalid-token";
    await expect(getSession()).resolves.toBeNull();
  });

  it("clears the session cookie", async () => {
    await createSession({
      id: 1,
      role: "student",
      name: "Test Student",
    });

    await clearSession();

    expect(store.delete).toHaveBeenCalledWith("tm_session");
    await expect(getSession()).resolves.toBeNull();
  });

  it("allows users with the required role", async () => {
    await createSession({
      id: 2,
      role: "recruiter",
      name: "Test Recruiter",
    });

    await expect(requireRole("recruiter")).resolves.toEqual({
      id: 2,
      role: "recruiter",
      name: "Test Recruiter",
    });
  });

  it("rejects users with the wrong role", async () => {
    await createSession({
      id: 1,
      role: "student",
      name: "Test Student",
    });

    await expect(requireRole("recruiter")).resolves.toBeNull();
  });

  it("throws an error when JWT_SECRET is missing", async () => {
    delete process.env.JWT_SECRET;

    await expect(
      createSession({
        id: 1,
        role: "student",
        name: "Test Student",
      })
    ).rejects.toThrow("JWT_SECRET is not set");
  });
});
