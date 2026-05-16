import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;

  if (accessToken) {
    await fetch(`${apiBaseUrl}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }).catch(() => {
      // Ignore backend logout failures and always clear local cookies.
    });
  }

  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");

  return response;
}
