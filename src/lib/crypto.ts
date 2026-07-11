/**
 * AES-256-GCM による暗号化ブロブ
 *
 * blob = IV(12) + ciphertext(平文長) + GCM tag(16)
 *
 * Web Crypto (globalThis.crypto) を使うため Node / ブラウザ / Vitest で同一コードが動く。
 * AAD で用途を束縛し、他システム向け暗号文の流用を弾く。
 */
export const IV_LENGTH = 12;
export const TAG_LENGTH = 16;

const AAD = new TextEncoder().encode("sumisumi-anniv:v1");

async function importKey(key: Uint8Array, usage: KeyUsage): Promise<CryptoKey> {
  if (key.length !== 32) {
    throw new RangeError(`鍵は 32 バイトが必要: ${key.length} バイト`);
  }
  return crypto.subtle.importKey("raw", key as BufferSource, "AES-GCM", false, [
    usage,
  ]);
}

export async function encryptBlob(
  key: Uint8Array,
  plaintext: Uint8Array,
): Promise<Uint8Array> {
  const cryptoKey = await importKey(key, "encrypt");
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  // Web Crypto は ciphertext 末尾に tag を連結して返す
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: AAD },
      cryptoKey,
      plaintext as BufferSource,
    ),
  );
  const blob = new Uint8Array(IV_LENGTH + encrypted.length);
  blob.set(iv, 0);
  blob.set(encrypted, IV_LENGTH);
  return blob;
}

/** 復号失敗（改竄・別鍵・形式不正）は DecryptError を投げる */
export class DecryptError extends Error {
  constructor(message = "復号に失敗しました") {
    super(message);
    this.name = "DecryptError";
  }
}

export async function decryptBlob(
  key: Uint8Array,
  blob: Uint8Array,
): Promise<Uint8Array> {
  if (blob.length < IV_LENGTH + TAG_LENGTH) {
    throw new DecryptError("ブロブが短すぎます");
  }
  const cryptoKey = await importKey(key, "decrypt");
  const iv = blob.subarray(0, IV_LENGTH);
  const encrypted = blob.subarray(IV_LENGTH);
  try {
    return new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as BufferSource, additionalData: AAD },
        cryptoKey,
        encrypted as BufferSource,
      ),
    );
  } catch {
    throw new DecryptError();
  }
}
