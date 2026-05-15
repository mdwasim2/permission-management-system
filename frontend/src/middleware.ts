import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/"];
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAccessToken = Boolean(request.cookies.get("access_token")?.value);
  const hasRefreshToken = Boolean(request.cookies.get("refresh_token")?.value);

  // Allow either token to pass the first gate; the home page can then restore the session if needed.
  const hasSession = hasAccessToken || hasRefreshToken;

  if (protectedRoutes.includes(pathname) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authRoutes.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register"],
};
