/**
 * Client-side AES-256-GCM encryption using Web Crypto API.
 * Messages are encrypted before being sent to Supabase.
 * The encryption key is derived from a shared passphrase using PBKDF2.
 */

const SALT = new Uint8Array([
  0x48, 0x42, 0x44, 0x5f, 0x41, 0x4e, 0x55, 0x53,
  0x48, 0x52, 0x45, 0x45, 0x5f, 0x32, 0x30, 0x32,
]); // "HBD_ANUSHREE_202" as bytes

const PBKDF2_ITERATIONS = 100_000;

interface EncryptedPayload {
  iv: string;    // base64-encoded IV
  ct: string;    // base64-encoded ciphertext
}

/**
 * Derive an AES-256-GCM key from a passphrase using PBKDF2
 */
export async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext using AES-256-GCM
 */
export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  const payload: EncryptedPayload = {
    iv: uint8ToBase64(iv),
    ct: uint8ToBase64(new Uint8Array(ciphertext)),
  };

  return JSON.stringify(payload);
}

/**
 * Decrypt ciphertext using AES-256-GCM
 */
export async function decrypt(encryptedStr: string, key: CryptoKey): Promise<string> {
  try {
    const payload: EncryptedPayload = JSON.parse(encryptedStr);
    const iv = base64ToUint8(payload.iv);
    const ciphertext = base64ToUint8(payload.ct);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      key,
      ciphertext as unknown as BufferSource
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return '[Unable to decrypt message]';
  }
}

/**
 * Generate a SHA-256 checksum for data integrity
 */
export async function generateChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Store the derived key in localStorage (persists across tabs and reloads)
 */
export async function storeEncryptionKey(passphrase: string): Promise<void> {
  // We store the passphrase, not the key (CryptoKey can't be serialized easily)
  localStorage.setItem('chat_encryption_passphrase', passphrase);
}

/**
 * Get or derive the encryption key from stored passphrase
 */
export async function getEncryptionKey(): Promise<CryptoKey | null> {
  const passphrase = localStorage.getItem('chat_encryption_passphrase');
  if (!passphrase) return null;
  return deriveKey(passphrase);
}

/**
 * Check if an encryption key is stored
 */
export function hasEncryptionKey(): boolean {
  return localStorage.getItem('chat_encryption_passphrase') !== null;
}

/**
 * Clear the stored encryption key
 */
export function clearEncryptionKey(): void {
  localStorage.removeItem('chat_encryption_passphrase');
}

// ---- Base64 helpers (browser-compatible) ----

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
