import crypto from "crypto";

const CSRF_SECRET = process.env.CSRF_SECRET ?? process.env.SESSION_SECRET ?? crypto.randomBytes(32).toString("hex");
const TOKEN_LENGTH = 32;
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

interface CsrfTokenPayload {
  token: string;
  expiresAt: number;
  createdAt: number;
}

interface CsrfTokenStore {
  [key: string]: CsrfTokenPayload;
}

const tokenStore: CsrfTokenStore = {};

function generateHmac(data: string): string {
  return crypto.createHmac("sha256", CSRF_SECRET).update(data).digest("hex");
}

export function generateCsrfToken(sessionId?: string): string {
  const randomBytes = crypto.randomBytes(TOKEN_LENGTH);
  const token = randomBytes.toString("hex");
  const now = Date.now();

  const payload: CsrfTokenPayload = {
    token,
    expiresAt: now + TOKEN_EXPIRY_MS,
    createdAt: now,
  };

  const storeKey = sessionId ?? "anonymous";
  tokenStore[storeKey] = payload;

  cleanupExpiredTokens();

  const signature = generateHmac(`${token}:${storeKey}:${now}`);
  return `${token}.${signature}`;
}

export function validateCsrfToken(
  token: string,
  sessionId?: string
): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [rawToken, signature] = parts;
  const storeKey = sessionId ?? "anonymous";
  const stored = tokenStore[storeKey];

  if (!stored) {
    return false;
  }

  if (Date.now() > stored.expiresAt) {
    delete tokenStore[storeKey];
    return false;
  }

  if (stored.token !== rawToken) {
    return false;
  }

  const expectedSignature = generateHmac(
    `${rawToken}:${storeKey}:${stored.createdAt}`
  );

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

export function invalidateCsrfToken(sessionId?: string): void {
  const storeKey = sessionId ?? "anonymous";
  delete tokenStore[storeKey];
}

function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const key of Object.keys(tokenStore)) {
    if (now > tokenStore[key].expiresAt) {
      delete tokenStore[key];
    }
  }
}

export function setCsrfCookie(response: Response, token: string): Response {
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });

  newResponse.headers.append(
    "Set-Cookie",
    `csrf-token=${token}; Path=/; HttpOnly=false; SameSite=Strict; Max-Age=${TOKEN_EXPIRY_MS / 1000}`
  );

  return newResponse;
}
