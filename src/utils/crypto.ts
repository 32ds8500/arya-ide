import { randomBytes, createHash, createCipheriv, createDecipheriv, scryptSync, createHmac, timingSafeEqual as safeCompare } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;

export function generateId(): string {
  return randomBytes(16).toString("hex");
}

export function generateToken(length: number = 32): string {
  return randomBytes(length).toString("base64url");
}

export function generateApiKey(): string {
  const prefix = "arya_";
  return prefix + generateToken(48);
}

export function hash(data: string, algorithm: string = "sha256"): string {
  return createHash(algorithm).update(data).digest("hex");
}

export function verify(data: string, hashedData: string, algorithm: string = "sha256"): boolean {
  return hash(data, algorithm) === hashedData;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const key = scryptSync(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, key] = hashedPassword.split(":");
  const keyBuffer = scryptSync(password, salt, 64);
  return keyBuffer.toString("hex") === key;
}

export function encrypt(text: string, secret: string): string {
  const iv = randomBytes(IV_LENGTH);
  const salt = randomBytes(SALT_LENGTH);
  const key = scryptSync(secret, salt, 32);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return `${salt.toString("hex")}:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string, secret: string): string {
  const [saltHex, ivHex, tagHex, encrypted] = encryptedText.split(":");

  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const key = scryptSync(secret, salt, 32);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function generateSalt(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

export function hmac(data: string, secret: string, algorithm: string = "sha256"): string {
  return createHmac(algorithm, secret).update(data).digest("hex");
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return safeCompare(Buffer.from(a), Buffer.from(b));
}
