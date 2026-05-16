import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  authRoutes,
  protectedRoutes,
  routePermissions,
} from "@/lib/route-config";

type AccessTokenPayload = {
  permissions?: string[];
};

function decodePayload(token: string) {
  try {
    const [, payload] = token.split(".");

    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalizedPayload)) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const hasRefreshToken = Boolean(request.cookies.get("refresh_token")?.value);
  const hasAccessToken = Boolean(accessToken);
  const hasSession = hasAccessToken || hasRefreshToken;
  const requiredPermission =
    routePermissions[pathname as keyof typeof routePermissions];

  // Allow forbidden page to be accessible to everyone
  if (pathname === "/forbidden") {
    return NextResponse.next();
  }

  // Permission check for protected routes
  if (requiredPermission && accessToken) {
    const payload = decodePayload(accessToken);
    const permissions = payload?.permissions ?? [];

    if (!permissions.includes(requiredPermission) && !hasRefreshToken) {
      return NextResponse.redirect(new URL("/forbidden", request.url));
    }
  }

  if (requiredPermission && !accessToken && hasRefreshToken) {
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }

  // Protected routes require session
  if (protectedRoutes.includes(pathname) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Auth routes are always accessible (allow user to switch account)
  if (authRoutes.some((route) => route === pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/users",
    "/leads",
    "/tasks",
    "/reports",
    "/audit-log",
    "/customer-portal",
    "/settings",
    "/forbidden",
    "/login",
    "/register",
  ],
};
