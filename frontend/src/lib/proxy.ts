import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function proxyToBackend(req: NextRequest, targetPath: string): Promise<NextResponse> {
  const url = `${BACKEND_URL}${targetPath}`;
  const headers: Record<string, string> = {};

  req.headers.forEach((val, key) => {
    if (key.toLowerCase() !== "host" && key.toLowerCase() !== "content-length") {
      headers[key] = val;
    }
  });

  let body: ArrayBuffer | undefined = undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await req.arrayBuffer();
    } catch {
      // no body
    }
  }

  try {
    const res = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const resText = await res.text();
    return new NextResponse(resText, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (err: any) {
    console.error(`[ProxyError] Failed to forward request to ${url}:`, err);
    return NextResponse.json(
      { error: "Backend service unavailable. Ensure Python FastAPI backend is running." },
      { status: 503 }
    );
  }
}
