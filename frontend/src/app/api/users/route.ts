import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

function buildAuthHeaders(request: NextRequest, includeJson = false) {
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return null;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function proxyUpstream(response: Response) {
  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function GET(request: NextRequest) {
  const headers = buildAuthHeaders(request);

  if (!headers) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const upstream = await fetch(`${apiBaseUrl}/users`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  return proxyUpstream(upstream);
}

export async function POST(request: NextRequest) {
  const headers = buildAuthHeaders(request, true);

  if (!headers) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.text();
  const upstream = await fetch(`${apiBaseUrl}/users`, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  });

  return proxyUpstream(upstream);
}
