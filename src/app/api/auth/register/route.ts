import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }
    const { user, token } = await createUser(parsed.data.email, parsed.data.password, parsed.data.name);
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Registration failed" }, { status: 400 });
  }
}
