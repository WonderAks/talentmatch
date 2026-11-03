import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Role-based route protection: /student/* for students, /recruiter/* for recruiters.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const need = pathname.startsWith("/student")
    ? "student"
    : pathname.startsWith("/recruiter")
    ? "recruiter"
    : null;
  if (!need) return NextResponse.next();

  let role: string | null = null;
  const token = req.cookies.get("tm_session")?.value;
  if (token && process.env.JWT_SECRET) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      role = payload.role as string;
    } catch {
      role = null;
    }
  }

  if (!role) return NextResponse.redirect(new URL("/login", req.url));
  if (role !== need) return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/student/:path*", "/recruiter/:path*"] };
