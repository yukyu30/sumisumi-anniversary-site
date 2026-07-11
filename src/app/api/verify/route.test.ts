import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as issue } from "../issue/route";
import { POST as verify } from "./route";

const KEY_HEX = "b".repeat(64);

function request(url: string, body: unknown): Request {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/verify", () => {
  beforeEach(() => {
    vi.stubEnv("ANNIV_SECRET_KEY", KEY_HEX);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("issue の出力を渡すと元の ID・years・issuedAt (unix 秒) が返る", async () => {
    const issued = await issue(
      request("/api/issue", { id: "墨澄ファン_01", years: 3 }),
    );
    const { payload } = (await issued.json()) as { payload: string };

    const res = await verify(request("/api/verify", { payload }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      id: string;
      years: number;
      issuedAt: number;
    };
    expect(body.id).toBe("墨澄ファン_01");
    expect(body.years).toBe(3);
    expect(body.issuedAt).toBeGreaterThan(0);
  });

  it("改竄ブロブ → 422", async () => {
    const issued = await issue(request("/api/issue", { id: "a", years: 1 }));
    const { payload } = (await issued.json()) as { payload: string };
    const blob = Buffer.from(payload, "base64");
    blob[14] ^= 0x01; // ciphertext を 1bit 反転
    const res = await verify(
      request("/api/verify", { payload: blob.toString("base64") }),
    );
    expect(res.status).toBe(422);
  });

  it("別鍵で発行されたブロブ → 422", async () => {
    const issued = await issue(request("/api/issue", { id: "a", years: 1 }));
    const { payload } = (await issued.json()) as { payload: string };
    vi.stubEnv("ANNIV_SECRET_KEY", "c".repeat(64));
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

  it("鍵未設定 → 500", async () => {
    vi.stubEnv("ANNIV_SECRET_KEY", "");
    const res = await verify(request("/api/verify", { payload: "QUJD" }));
    expect(res.status).toBe(500);
  });
});
