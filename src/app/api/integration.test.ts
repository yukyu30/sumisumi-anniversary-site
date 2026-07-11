import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { decodeBarcode } from "@/lib/barcode/decode";
import { encodeBarcode } from "@/lib/barcode/encode";
import { rasterize } from "@/lib/barcode/rasterize";
import { grayFromRaster } from "@/lib/barcode/sampler";
import {
  jpegRoundtrip,
  padBelow,
  scaleBilinear,
} from "@/lib/barcode/test-degrade";
import { frameContainer } from "@/lib/container";
import { POST as issue } from "./issue/route";
import { POST as verify } from "./verify/route";

function request(url: string, body: unknown): Request {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("⑲ 全経路統合: issue → frame → encode → rasterize → JPEG 劣化 → decode → unframe → verify", () => {
  beforeEach(() => {
    vi.stubEnv("ANNIV_SECRET_KEY", "d".repeat(64));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("SNS 劣化を挟んでも発行データが復元・検証できる", async () => {
    // 1. 発行（サーバー: 暗号化）
    const issued = await issue(
      request("/api/issue", { id: "sumisumi_fan🖌️" }),
    );
    expect(issued.status).toBe(200);
    const { payload } = (await issued.json()) as { payload: string };

    // 2. クライアント相当: コンテナ化 → バーコード描画 → 合成画像
    const blob = Uint8Array.from(Buffer.from(payload, "base64"));
    const strip = rasterize(encodeBarcode(frameContainer(blob)), 20);
    const composed = padBelow(strip, 1240, 200); // 1280×1600 相当

    // 3. SNS 劣化（JPEG 再圧縮 + 60% 縮小 + 再圧縮）
    const degraded = jpegRoundtrip(
      scaleBilinear(jpegRoundtrip(composed, 80), 0.6),
      60,
    );

    // 4. クライアント相当: バーコード読み取り
    const recovered = decodeBarcode(grayFromRaster(degraded));

    // 5. 検証（サーバー: 復号）
    const res = await verify(
      request("/api/verify", {
        payload: Buffer.from(recovered).toString("base64"),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; years: number };
    expect(body.id).toBe("sumisumi_fan🖌️");
    expect(body.years).toBe(2);
  });
});
