import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing accessToken" },
        { status: 400 },
      );
    }

    const response = NextResponse.json({ success: true });

    // Set secure httpOnly cookies
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15, // 15 minutes
      path: "/",
    });

    if (refreshToken) {
      response.cookies.set("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to set auth cookies" },
      { status: 500 },
    );
  }
}
