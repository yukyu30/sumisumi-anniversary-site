import "server-only";

function decodeBase64(value: string | undefined, name: string): Uint8Array {
  if (!value) throw new Error(`${name} が未設定です`);
  try {
    return Uint8Array.from(Buffer.from(value, "base64"));
  } catch {
    throw new Error(`${name} の形式が不正です（base64）`);
  }
}

/**
 * 署名用の秘密鍵（Ed25519 pkcs8 を base64 にした ANNIV_PRIVATE_KEY）。
 * 画像の発行（署名）にのみ使う。
 */
export function getPrivateKey(): Uint8Array {
  const key = decodeBase64(process.env.ANNIV_PRIVATE_KEY, "ANNIV_PRIVATE_KEY");
  if (key.length < 32) throw new Error("ANNIV_PRIVATE_KEY が不正です");
  return key;
}

/**
 * 検証用の公開鍵（Ed25519 raw 32B を base64 にした ANNIV_PUBLIC_KEY）。
 * 画像の検証にのみ使う。
 */
export function getPublicKey(): Uint8Array {
  const key = decodeBase64(process.env.ANNIV_PUBLIC_KEY, "ANNIV_PUBLIC_KEY");
  if (key.length !== 32) throw new Error("ANNIV_PUBLIC_KEY が不正です");
  return key;
}
