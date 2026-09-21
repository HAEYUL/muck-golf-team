import "server-only";
import crypto from "node:crypto";

/** "salt:해시" 형태의 문자열을 만든다. Node 내장 scrypt만 사용해 별도 패키지가 필요 없다 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== derivedBuffer.length) return false;
  return crypto.timingSafeEqual(derivedBuffer, keyBuffer);
}
