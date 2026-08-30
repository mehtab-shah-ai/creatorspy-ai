import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolved = await params;
  const subpath = resolved.slug ? resolved.slug.join("/") : "";
  return proxyToBackend(req, `/api/medisense/${subpath}`);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolved = await params;
  const subpath = resolved.slug ? resolved.slug.join("/") : "";
  return proxyToBackend(req, `/api/medisense/${subpath}`);
}
