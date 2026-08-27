import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { config } from "./config";

const secret = new TextEncoder().encode(config.jwtSecret);

export interface AuthPayload {
  userId: string;
  email: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return { userId: payload.userId as string, email: payload.email as string };
  } catch {
    return null;
  }
}

export async function getUserFromRequest(
  req: Request,
): Promise<{ id: string; email: string } | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const payload = await verifyToken(token);
  if (!payload) return null;
  return { id: payload.userId, email: payload.email };
}

export async function createUser(email: string, password: string, name?: string) {
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already registered");
  const hash = await hashPassword(password);
  const user = await db.user.create({
    data: { email, passwordHash: hash, name },
  });
  const token = await signToken({ userId: user.id, email: user.email });
  return { user, token };
}

export async function loginUser(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new Error("Invalid credentials");
  const token = await signToken({ userId: user.id, email: user.email });
  return { user, token };
}
