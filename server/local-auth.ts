import { promisify } from "node:util";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export const LOCAL_PASSWORD_MIN_LENGTH = 8;
export const LOCAL_PASSWORD_MAX_LENGTH = 128;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algorithm, salt, encodedKey] = encodedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !encodedKey || encodedKey.length !== KEY_LENGTH * 2) return false;
  const expected = Buffer.from(encodedKey, "hex");
  const actual = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
