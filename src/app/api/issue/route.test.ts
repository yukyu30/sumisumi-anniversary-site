import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { decodePayload } from "@/lib/payload";
import { verifyToken } from "@/lib/sign";
import { ANNIVERSARY_YEARS, GENERATION_DEADLINE, POST } from "./route";

let PRIV_B64: string;
let PUB: Uint8Array;

function request(body: unknown): Request {
  return new Request("http://localhost/api/issue", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function decodeToken(payload: string) {
  const token = Uint8Array.from(Buffer.from(payload, "base64"));
  return decodePayload(await verifyToken(PUB, token));
}

beforeAll(async () => {
  const kp = await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ]);
  PRIV_B64 = Buffer.from(
    await crypto.subtle.exportKey("pkcs8", kp.privateKey),
  ).toString("base64");
  PUB = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
});

describe("POST /api/issue", () => {
  beforeEach(() => {
    vi.stubEnv("ANNIV_PRIVATE_KEY", PRIV_B64);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("受付期限を過ぎると 403", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(GENERATION_DEADLINE + 1000);
    const res = await POST(request({ id: "yukyu30" }));
    expect(res.status).toBe(403);
  });

  it("正常系: 署名トークンが返り、公開鍵で検証すると ID・2周年固定・現在時刻", async () => {
    const before = Math.floor(Date.now() / 1000);
    const res = await POST(request({ id: "yukyu30" }));
    const after = Math.floor(Date.now() / 1000);

    expect(res.status).toBe(200);
    const { payload, issuedAt } = (await res.json()) as {
      payload: string;
      issuedAt: number;
    };
    const decoded = await decodeToken(payload);
    expect(decoded.id).toBe("yukyu30");
    expect(decoded.years).toBe(ANNIVERSARY_YEARS);
    expect(ANNIVERSARY_YEARS).toBe(2);
    expect(decoded.timestamp).toBeGreaterThanOrEqual(before);
    expect(decoded.timestamp).toBeLessThanOrEqual(after);
    expect(issuedAt).toBe(decoded.timestamp);
  });

  it("years をリクエストで渡しても無視され、常に 2 周年になる", async () => {
    const res = await POST(request({ id: "yukyu30", years: 99 }));
    expect(res.status).toBe(200);
    const { payload } = (await res.json()) as { payload: string };
    expect((await decodeToken(payload)).years).toBe(ANNIVERSARY_YEARS);
  });

  it("ID は NFC 正規化 + trim される", async () => {
    const res = await POST(request({ id: "  すみ゙すみ  " }));
    expect(res.status).toBe(200);
    const { payload } = (await res.json()) as { payload: string };
    expect((await decodeToken(payload)).id).toBe(
      "すみ゙すみ".normalize("NFC").trim(),
    );
  });

  it("ID が空 / 空白のみ / 65 バイト超 → 400", async () => {
    for (const id of ["", "   ", "x".repeat(65)]) {
      const res = await POST(request({ id }));
      expect(res.status).toBe(400);
    }
  });

  it("JSON でないボディ → 400", async () => {
    const res = await POST(
      new Request("http://localhost/api/issue", {
        method: "POST",
        body: "not json",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("秘密鍵未設定 → 500", async () => {
    vi.stubEnv("ANNIV_PRIVATE_KEY", "");
    const res = await POST(request({ id: "yukyu30" }));
    expect(res.status).toBe(500);
  });

  it("秘密鍵が不正形式 → 500", async () => {
    vi.stubEnv("ANNIV_PRIVATE_KEY", "not-a-key");
    const res = await POST(request({ id: "yukyu30" }));
    expect(res.status).toBe(500);
  });
});
