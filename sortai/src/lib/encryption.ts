import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const PREFIX = "enc:";

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY ?? "";
  if (!secret || secret.length < 8) {
    if (process.env.NODE_ENV === "development") {
       
      console.warn("[encryption] ENCRYPTION_KEY not set — using insecure fallback for dev only.");
      return crypto.scryptSync("dev-fallback-key-do-not-use-in-prod", "fluxifia-salt", KEY_LENGTH);
    }
    throw new Error("ENCRYPTION_KEY must be set and at least 8 characters");
  }
  return crypto.scryptSync(secret, "fluxifia-salt", KEY_LENGTH);
}

/** Encrypt a string using AES-256-GCM. Returns iv:authTag:ciphertext hex. */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/** Decrypt a string. Throws if invalid. */
export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted data format");
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

/** Encrypt with a "enc:" prefix so we can detect encrypted values. */
export function encryptWithPrefix(plaintext: string): string {
  return PREFIX + encrypt(plaintext);
}

/** Decrypt with prefix. Falls back to returning the raw value if it's not prefixed (legacy plaintext). */
export function decryptWithPrefix(data: string | null | undefined): string {
  if (!data) return "";
  if (!data.startsWith(PREFIX)) return data; // legacy plaintext
  try {
    return decrypt(data.slice(PREFIX.length));
  } catch {
    return data; // corrupted, return raw to avoid crashing
  }
}

/** Same as decryptWithPrefix but for tokens (no prefix, uses heuristic). */
export function decryptToken(data: string | null | undefined): string {
  if (!data) return "";
  // If it looks like our encrypted format (hex:hex:hex), try decrypting
  const parts = data.split(":");
  if (parts.length === 3 && parts.every((p) => /^[0-9a-f]+$/i.test(p))) {
    try {
      return decrypt(data);
    } catch {
      return data;
    }
  }
  return data; // plaintext legacy
}

/** Hash a Gmail message ID using HMAC-SHA256 (anonymised, not reversible). */
export function hashMessageId(gmailId: string): string {
  return crypto.createHmac("sha256", getKey()).update(gmailId).digest("hex");
}
