import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decryptBlob } from "@/lib/crypto";
import { decodePayload } from "@/lib/payload";
import { ANNIVERSARY_YEARS, POST } from "./route";

const KEY_HEX = "a".repeat(64);
const KEY = Uint8Array.from(Buffer.from(KEY_HEX, "hex"));

function request(body: unknown): Request {
  return new Request("http://localhost/api/issue", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/issue", () => {
  beforeEach(() => {
    vi.stubEnv("ANNIV_SECRET_KEY", KEY_HEX);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("正常系: base64 ブロブが返り、復号すると ID・2周年固定・サーバー付与の現在時刻", async () => {
    const before = Math.floor(Date.now() / 1000);
    const res = await POST(request({ id: "yukyu30" }));
    const after = Math.floor(Date.now() / 1000);

    expect(res.status).toBe(200);
    const { payload, issuedAt } = (await res.json()) as {
      payload: string;
      issuedAt: number;
    };
    const blob = Uint8Array.from(Buffer.from(payload, "base64"));
    const decoded = decodePayload(await decryptBlob(KEY, blob));
    expect(decoded.id).toBe("yukyu30");
    // 周年数は入力させず 2 周年固定
    expect(decoded.years).toBe(ANNIVERSARY_YEARS);
    expect(ANNIVERSARY_YEARS).toBe(2);
    expect(decoded.timestamp).toBeGreaterThanOrEqual(before);
    expect(decoded.timestamp).toBeLessThanOrEqual(after);
    // 画像に印字する発行時刻は暗号化された timestamp と一致する
    expect(issuedAt).toBe(decoded.timestamp);
  });

  it("years をリクエストで渡しても無視され、常に 2 周年になる", async () => {
    const res = await POST(request({ id: "yukyu30", years: 99 }));
    expect(res.status).toBe(200);
    const { payload } = (await res.json()) as { payload: string };
    const blob = Uint8Array.from(Buffer.from(payload, "base64"));
    const decoded = decodePayload(await decryptBlob(KEY, blob));
    expect(decoded.years).toBe(ANNIVERSARY_YEARS);
  });

  it("ID は NFC 正規化 + trim される", async () => {
    const res = await POST(request({ id: "  すみ゙すみ  " }));
    expect(res.status).toBe(200);
    const { payload } = (await res.json()) as { payload: string };
    const blob = Uint8Array.from(Buffer.from(payload, "base64"));
    const decoded = decodePayload(await decryptBlob(KEY, blob));
    expect(decoded.id).toBe("すみ゙すみ".normalize("NFC").trim());
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

  it("鍵未設定 → 500", async () => {
    vi.stubEnv("ANNIV_SECRET_KEY", "");
    const res = await POST(request({ id: "yukyu30" }));
    expect(res.status).toBe(500);
  });

  it("鍵が不正形式（短い hex）→ 500", async () => {
    vi.stubEnv("ANNIV_SECRET_KEY", "abcd");
    const res = await POST(request({ id: "yukyu30" }));
    expect(res.status).toBe(500);
  });
});
