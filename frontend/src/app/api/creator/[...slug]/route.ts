import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/proxy";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await props.params;
  const path = `/api/creator/${slug.join("/")}${req.nextUrl.search}`;
  return proxyToBackend(req, path);
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await props.params;
  const path = `/api/creator/${slug.join("/")}${req.nextUrl.search}`;
  return proxyToBackend(req, path);
}
