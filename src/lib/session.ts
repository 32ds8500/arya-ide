import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export { auth };

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  displayName?: string;
}

export async function getCurrentUser(
  request: NextRequest
): Promise<CurrentUser | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: (session.user as Record<string, unknown>).role as string ?? "user",
      avatarUrl: (session.user as Record<string, unknown>).image as string | undefined,
      displayName: (session.user as Record<string, unknown>).displayName as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(
  request: NextRequest
): Promise<CurrentUser> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new AuthError("Authentication required", 401);
  }

  return user;
}

export async function requireAdmin(
  request: NextRequest
): Promise<CurrentUser> {
  const user = await requireAuth(request);

  if (user.role !== "admin") {
    throw new AuthError("Admin access required", 403);
  }

  return user;
}

export async function requireRole(
  request: NextRequest,
  requiredRole: string
): Promise<CurrentUser> {
  const user = await requireAuth(request);

  if (user.role !== requiredRole) {
    throw new AuthError(`Role '${requiredRole}' required`, 403);
  }

  return user;
}

export class AuthError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export async function validateSessionToken(token: string): Promise<boolean> {
  try {
    const session = await auth.api.getSession({
      headers: new Headers({ cookie: `better-auth.session_token=${token}` }),
    });

    return !!session?.user;
  } catch {
    return false;
  }
}

export function extractTokenFromHeaders(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const sessionCookie = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("better-auth.session_token="));

    if (sessionCookie) {
      return sessionCookie.split("=")[1];
    }
  }

  return null;
}
