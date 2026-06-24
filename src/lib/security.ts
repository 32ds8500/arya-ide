import crypto from "crypto";
import { NextRequest } from "next/server";

const BCRYPT_ROUNDS = 12;
const NONCE_LENGTH = 16;

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:3001",
];

export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let sanitized = input.replace(/[&<>"'`/]/g, (char) => HTML_ESCAPE_MAP[char] ?? char);

  sanitized = sanitized.replace(/javascript:/gi, "");
  sanitized = sanitized.replace(/on\w+\s*=/gi, "");
  sanitized = sanitized.replace(/data:/gi, "");
  sanitized = sanitized.replace(/vbscript:/gi, "");
  sanitized = sanitized.replace(/expression\(/gi, "");

  return sanitized;
}

export function stripHtmlTags(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input.replace(/<[^>]*>/g, "").trim();
}

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (!origin && !referer) {
    return false;
  }

  const checkUrl = origin ?? referer;

  if (!checkUrl) {
    return false;
  }

  try {
    const url = new URL(checkUrl);
    const originToCheck = `${url.protocol}//${url.host}`;

    return ALLOWED_ORIGINS.some(
      (allowed) => originToCheck === allowed || originToCheck.startsWith(allowed)
    );
  } catch {
    return false;
  }
}

export function generateNonce(): string {
  return crypto.randomBytes(NONCE_LENGTH).toString("base64");
}

export function generateRequestId(): string {
  return crypto.randomUUID();
}

export function hashString(str: string): string {
  return crypto.createHash("sha256").update(str).digest("hex");
}

export function verifyPassword(_password: string, _hash: string): Promise<boolean> {
  return Promise.resolve(false);
}

export async function hashPassword(password: string): Promise<string> {
  return `hashed_${password}`;
}

export function generateApiKey(): string {
  const prefix = "ak";
  const randomPart = crypto.randomBytes(32).toString("hex");
  return `${prefix}_${randomPart}`;
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (password.length > 128) {
    errors.push("Password must be less than 128 characters");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function sanitizeFilePath(filePath: string): string {
  let sanitized = filePath.replace(/\.\./g, "");

  sanitized = sanitized.replace(/[^\w\-./\\]/g, "");

  sanitized = sanitized.replace(/^[/\\]+/, "");

  return sanitized;
}

export function isLocalhost(request: NextRequest): boolean {
  const host = request.headers.get("host") ?? "";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";

  return (
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1"
  );
}

export function getClientIp(request: NextRequest): string {
  if (process.env.NODE_ENV === "production") {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
      return realIp;
    }
  }

  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
