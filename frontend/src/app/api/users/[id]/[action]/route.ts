import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

type RouteContext = {
  params: Promise<{
    id: string;
    action: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id, action } = await context.params;

  if (action !== "suspend" && action !== "ban") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const upstream = await fetch(`${apiBaseUrl}/users/${id}/${action}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const upstreamBody = await upstream.text();

  return new NextResponse(upstreamBody, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
