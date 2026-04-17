import { ENCRYPTION_ITERATIONS, VERIFIER_PLAINTEXT } from "./constants";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// ─── Key Derivation ──────────────────────────────────────────

async function getKeyMaterial(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
}

export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const keyMaterial = await getKeyMaterial(password);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: ENCRYPTION_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ─── Encrypt / Decrypt ───────────────────────────────────────

export async function encrypt(
  key: CryptoKey,
  plaintext: string
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );
  // Concat iv + ciphertext → base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decrypt(
  key: CryptoKey,
  encrypted: string
): Promise<string> {
  const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return decoder.decode(plaintext);
}

// ─── Master Key ─────────────────────────────────────────────

export async function generateMasterKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportMasterKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

export async function importMasterKey(base64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function wrapMasterKey(
  masterKey: CryptoKey,
  wrappingKey: CryptoKey
): Promise<string> {
  const raw = await exportMasterKey(masterKey);
  return encrypt(wrappingKey, raw);
}

export async function unwrapMasterKey(
  wrapped: string,
  wrappingKey: CryptoKey
): Promise<CryptoKey> {
  const raw = await decrypt(wrappingKey, wrapped);
  return importMasterKey(raw);
}

// ─── Recovery Key ───────────────────────────────────────────

export function generateRecoveryKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(bytes, (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
  return hex.toUpperCase().match(/.{4}/g)!.join("-");
}

export function normalizeRecoveryKey(key: string): string {
  return key.replace(/-/g, "").toUpperCase();
}

// ─── Setup (Master Key Architecture) ────────────────────────

export async function createMasterKeySetup(password: string): Promise<{
  salt: string;
  verifier: string;
  masterKey: CryptoKey;
  encryptedMasterKey: string;
  recoverySalt: string;
  recoveryEncryptedMasterKey: string;
  recoveryKey: string;
  recoveryKeyEncrypted: string;
}> {
  const masterKey = await generateMasterKey();

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const wrappingKey = await deriveKey(password, salt);
  const verifier = await encrypt(wrappingKey, VERIFIER_PLAINTEXT);
  const encryptedMasterKey = await wrapMasterKey(masterKey, wrappingKey);

  const recoveryKey = generateRecoveryKey();
  const recoverySalt = crypto.getRandomValues(new Uint8Array(16));
  const recoveryWrappingKey = await deriveKey(
    normalizeRecoveryKey(recoveryKey),
    recoverySalt
  );
  const recoveryEncryptedMasterKey = await wrapMasterKey(
    masterKey,
    recoveryWrappingKey
  );
  const recoveryKeyEncrypted = await encrypt(masterKey, recoveryKey);

  return {
    salt: btoa(String.fromCharCode(...salt)),
    verifier,
    masterKey,
    encryptedMasterKey,
    recoverySalt: btoa(String.fromCharCode(...recoverySalt)),
    recoveryEncryptedMasterKey,
    recoveryKey,
    recoveryKeyEncrypted,
  };
}

// ─── Verify & Unwrap ────────────────────────────────────────

/** Legacy: verify password only (for migration from old schema) */
export async function verifyPasswordLegacy(
  password: string,
  saltBase64: string,
  verifier: string
): Promise<CryptoKey | null> {
  try {
    const salt = Uint8Array.from(atob(saltBase64), (c) => c.charCodeAt(0));
    const key = await deriveKey(password, salt);
    const decrypted = await decrypt(key, verifier);
    if (decrypted === VERIFIER_PLAINTEXT) return key;
    return null;
  } catch {
    return null;
  }
}

/** New: verify password + unwrap master key */
export async function verifyAndUnwrapMasterKey(
  password: string,
  saltBase64: string,
  verifier: string,
  encryptedMasterKey: string
): Promise<CryptoKey | null> {
  try {
    const salt = Uint8Array.from(atob(saltBase64), (c) => c.charCodeAt(0));
    const wrappingKey = await deriveKey(password, salt);
    const decrypted = await decrypt(wrappingKey, verifier);
    if (decrypted !== VERIFIER_PLAINTEXT) return null;
    return unwrapMasterKey(encryptedMasterKey, wrappingKey);
  } catch {
    return null;
  }
}

/** Recover: unwrap master key with recovery key */
export async function recoverMasterKey(
  recoveryKey: string,
  recoverySaltBase64: string,
  recoveryEncryptedMasterKey: string
): Promise<CryptoKey | null> {
  try {
    const normalized = normalizeRecoveryKey(recoveryKey);
    const salt = Uint8Array.from(atob(recoverySaltBase64), (c) =>
      c.charCodeAt(0)
    );
    const wrappingKey = await deriveKey(normalized, salt);
    return unwrapMasterKey(recoveryEncryptedMasterKey, wrappingKey);
  } catch {
    return null;
  }
}

/** Re-wrap master key with a new password */
export async function rewrapMasterKey(
  masterKey: CryptoKey,
  newPassword: string
): Promise<{
  salt: string;
  verifier: string;
  encryptedMasterKey: string;
}> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const wrappingKey = await deriveKey(newPassword, salt);
  const verifier = await encrypt(wrappingKey, VERIFIER_PLAINTEXT);
  const encryptedMasterKey = await wrapMasterKey(masterKey, wrappingKey);
  return {
    salt: btoa(String.fromCharCode(...salt)),
    verifier,
    encryptedMasterKey,
  };
}
