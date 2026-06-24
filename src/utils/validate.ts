const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

export function isEmail(value: string): boolean {
  return EMAIL_REGEX.test(value);
}

export function isUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function isUrl(value: string): boolean {
  return URL_REGEX.test(value);
}

export function isStrongPassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) errors.push("Password must be at least 8 characters long");
  if (password.length > 128) errors.push("Password must be less than 128 characters");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain at least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Password must contain at least one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Password must contain at least one number");
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password))
    errors.push("Password must contain at least one special character");

  return { valid: errors.length === 0, errors };
}

export function isNonEmpty(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value !== null && value !== undefined;
}

export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function isAlphanumeric(value: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(value);
}

export function isValidFilename(name: string): boolean {
  const invalid = /[<>:"/\\|?*\x00-\x1f]/; // eslint-disable-line no-control-regex
  return !invalid.test(name) && name.length > 0 && name.length <= 255 && !name.endsWith(".");
}

export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

export function isValidJSON(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/["'`;]/g, "")
    .trim();
}

export function validateRequired<T extends Record<string, unknown>>(
  data: T,
  fields: (keyof T)[]
): { valid: boolean; missing: string[] } {
  const missing = fields.filter((field) => !isNonEmpty(data[field]));
  return { valid: missing.length === 0, missing: missing.map(String) };
}
