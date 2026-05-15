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

  // Allow either token to pass the first gate; the home page can then restore the session if needed.
  const hasSession = hasAccessToken || hasRefreshToken;
  const requiredPermission =
    routePermissions[pathname as keyof typeof routePermissions];

  if (requiredPermission && accessToken) {
    const payload = decodePayload(accessToken);
    const permissions = payload?.permissions ?? [];

    if (!permissions.includes(requiredPermission) && !hasRefreshToken) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (protectedRoutes.includes(pathname) && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authRoutes.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
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
    "/login",
    "/register",
  ],
};
