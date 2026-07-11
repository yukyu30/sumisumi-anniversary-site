import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as issue } from "../issue/route";
import { POST as verify } from "./route";

let PRIV_B64: string;
let PUB_B64: string;
let OTHER_PUB_B64: string;

function request(url: string, body: unknown): Request {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function exportPair() {
  const kp = await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ]);
  return {
    priv: Buffer.from(
      await crypto.subtle.exportKey("pkcs8", kp.privateKey),
    ).toString("base64"),
    pub: Buffer.from(
      await crypto.subtle.exportKey("raw", kp.publicKey),
    ).toString("base64"),
  };
}

beforeAll(async () => {
  const pair = await exportPair();
  PRIV_B64 = pair.priv;
  PUB_B64 = pair.pub;
  OTHER_PUB_B64 = (await exportPair()).pub;
});

describe("POST /api/verify", () => {
  beforeEach(() => {
    vi.stubEnv("ANNIV_PRIVATE_KEY", PRIV_B64);
    vi.stubEnv("ANNIV_PUBLIC_KEY", PUB_B64);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("issue の出力を渡すと元の ID・2周年固定・issuedAt が返る", async () => {
    const issued = await issue(request("/api/issue", { id: "墨澄ファン_01" }));
    const { payload } = (await issued.json()) as { payload: string };

    const res = await verify(request("/api/verify", { payload }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      id: string;
      years: number;
      issuedAt: number;
    };
    expect(body.id).toBe("墨澄ファン_01");
    expect(body.years).toBe(2);
    expect(body.issuedAt).toBeGreaterThan(0);
  });

  it("改竄トークン → 422", async () => {
    const issued = await issue(request("/api/issue", { id: "a" }));
    const { payload } = (await issued.json()) as { payload: string };
    const token = Buffer.from(payload, "base64");
    token[token.length - 1] ^= 0x01; // 署名を 1bit 反転
    const res = await verify(
      request("/api/verify", { payload: token.toString("base64") }),
    );
    expect(res.status).toBe(422);
  });

  it("別の公開鍵で検証 → 422", async () => {
    const issued = await issue(request("/api/issue", { id: "a" }));
    const { payload } = (await issued.json()) as { payload: string };
    vi.stubEnv("ANNIV_PUBLIC_KEY", OTHER_PUB_B64);
    const res = await verify(request("/api/verify", { payload }));
    expect(res.status).toBe(422);
  });

  it("base64 でない / 空 / 巨大な payload → 400", async () => {
    for (const payload of ["!!!not-base64!!!", "", "A".repeat(1000)]) {
      const res = await verify(request("/api/verify", { payload }));
      expect(res.status).toBe(400);
    }
  });

  it("payload 欠落 → 400", async () => {
    const res = await verify(request("/api/verify", {}));
    expect(res.status).toBe(400);
  });

  it("公開鍵未設定 → 500", async () => {
    vi.stubEnv("ANNIV_PUBLIC_KEY", "");
    const res = await verify(request("/api/verify", { payload: "QUJD" }));
    expect(res.status).toBe(500);
  });
});
