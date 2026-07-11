import { beforeAll, describe, expect, it } from "vitest";
import { SignatureError, signPayload, verifyToken } from "./sign";

let priv: Uint8Array;
let pub: Uint8Array;
let otherPub: Uint8Array;

async function keypair() {
  const kp = await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ]);
  return {
    priv: new Uint8Array(await crypto.subtle.exportKey("pkcs8", kp.privateKey)),
    pub: new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey)),
  };
}

const PAYLOAD = new TextEncoder().encode("hello sumisumi 2周年");

beforeAll(async () => {
  ({ priv, pub } = await keypair());
  otherPub = (await keypair()).pub;
});

describe("Ed25519 sign / verify", () => {
  it("秘密鍵で署名 → 公開鍵で検証して payload を復元", async () => {
    const token = await signPayload(priv, PAYLOAD);
    const recovered = await verifyToken(pub, token);
    expect(Array.from(recovered)).toEqual(Array.from(PAYLOAD));
  });

  it("トークン長 = payload + 64(署名)", async () => {
    const token = await signPayload(priv, PAYLOAD);
    expect(token.length).toBe(PAYLOAD.length + 64);
  });

  it("payload 改竄で SignatureError", async () => {
    const token = await signPayload(priv, PAYLOAD);
    token[0] ^= 0x01;
    await expect(verifyToken(pub, token)).rejects.toThrow(SignatureError);
  });

  it("署名 改竄で SignatureError", async () => {
    const token = await signPayload(priv, PAYLOAD);
    token[token.length - 1] ^= 0x01;
    await expect(verifyToken(pub, token)).rejects.toThrow(SignatureError);
  });

  it("別の公開鍵で SignatureError", async () => {
    const token = await signPayload(priv, PAYLOAD);
    await expect(verifyToken(otherPub, token)).rejects.toThrow(SignatureError);
  });

  it("短すぎるトークンで SignatureError", async () => {
    await expect(verifyToken(pub, new Uint8Array(10))).rejects.toThrow(
      SignatureError,
    );
  });
});
