import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type Role = "student" | "recruiter";
export type Session = { id: number; role: Role; name: string };

export const SESSION_COOKIE = "tm_session";

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function createSession(s: Session) {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: Number(payload.id),
      role: payload.role as Role,
      name: String(payload.name),
    };
  } catch {
    return null;
  }
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Returns the session only if it belongs to the required role. */
export async function requireRole(role: Role): Promise<Session | null> {
  const s = await getSession();
  return s && s.role === role ? s : null;
}
