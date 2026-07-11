/**
 * Ed25519 署名によるトークン。
 * 生成（発行）はサーバーの秘密鍵で署名し、検証は公開鍵で行う。
 *
 * token = payload || signature(64B)
 *
 * Web Crypto (globalThis.crypto) を使う。秘密鍵は pkcs8、公開鍵は raw(32B)。
 */
export const SIGNATURE_LENGTH = 64;

export class SignatureError extends Error {
  constructor(message = "署名の検証に失敗しました") {
    super(message);
    this.name = "SignatureError";
  }
}

async function importPrivateKey(pkcs8: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "pkcs8",
    pkcs8 as BufferSource,
    { name: "Ed25519" },
    false,
    ["sign"],
  );
}

async function importPublicKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    raw as BufferSource,
    { name: "Ed25519" },
    false,
    ["verify"],
  );
}

/** 秘密鍵で payload に署名し、payload+signature のトークンを返す */
export async function signPayload(
  privateKeyPkcs8: Uint8Array,
  payload: Uint8Array,
): Promise<Uint8Array> {
  const key = await importPrivateKey(privateKeyPkcs8);
  const sig = new Uint8Array(
    await crypto.subtle.sign("Ed25519", key, payload as BufferSource),
  );
  const token = new Uint8Array(payload.length + sig.length);
  token.set(payload, 0);
  token.set(sig, payload.length);
  return token;
}

/** 公開鍵でトークンを検証し、成功すれば payload を返す */
export async function verifyToken(
  publicKeyRaw: Uint8Array,
  token: Uint8Array,
): Promise<Uint8Array> {
  if (token.length <= SIGNATURE_LENGTH) {
    throw new SignatureError("トークンが短すぎます");
  }
  const payload = token.subarray(0, token.length - SIGNATURE_LENGTH);
  const sig = token.subarray(token.length - SIGNATURE_LENGTH);
  const key = await importPublicKey(publicKeyRaw);
  let ok: boolean;
  try {
    ok = await crypto.subtle.verify(
      "Ed25519",
      key,
      sig as BufferSource,
      payload as BufferSource,
    );
  } catch {
    throw new SignatureError();
  }
  if (!ok) throw new SignatureError();
  return payload.slice();
}
