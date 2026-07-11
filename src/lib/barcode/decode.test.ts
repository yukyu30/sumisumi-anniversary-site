import { describe, expect, it } from "vitest";
import { frameContainer } from "../container";
import { BarcodeDecodeError, decodeBarcode } from "./decode";
import { encodeBarcode } from "./encode";
import { rasterize, type Raster } from "./rasterize";
import { grayFromRaster } from "./sampler";
import {
  averagePool,
  boxBlur3,
  brightness,
  jpegRoundtrip,
  noiseRaster,
  padBelow,
  reduceContrast,
  rotate180Raster,
  scaleBilinear,
} from "./test-degrade";

/** 実運用に近いランダム風ブロブ（暗号文相当、71 バイト） */
function sampleBlob(): Uint8Array {
  const blob = new Uint8Array(71);
  let x = 0x12345678;
  for (let i = 0; i < blob.length; i++) {
    // 決定的な擬似乱数（LCG）
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    blob[i] = x & 0xff;
  }
  return blob;
}

describe("barcode decode", () => {
  it("⑨ 無劣化ラスタ（scale=20）からブロブを復元できる", () => {
    const blob = sampleBlob();
    const raster = rasterize(encodeBarcode(frameContainer(blob)), 20);
    const decoded = decodeBarcode(grayFromRaster(raster));
    expect(Array.from(decoded)).toEqual(Array.from(blob));
  });

  /** 合成後の縦長画像（1280×1600 相当）を模したストリップ */
  function composedRaster(blob: Uint8Array): Raster {
    const strip = rasterize(encodeBarcode(frameContainer(blob)), 20);
    return padBelow(strip, 1240, 96); // 下に本文（グレー）を継ぎ足す
  }

  function expectDecodes(raster: Raster, blob: Uint8Array) {
    const decoded = decodeBarcode(grayFromRaster(raster));
    expect(Array.from(decoded)).toEqual(Array.from(blob));
  }

  it("縦長の合成画像（下に本文がある）でも復元できる", () => {
    const blob = sampleBlob();
    expectDecodes(composedRaster(blob), blob);
  });

  it("⑩ 整数縮小（1/2, 1/4 平均プーリング）後も復元できる", () => {
    const blob = sampleBlob();
    for (const k of [2, 4]) {
      expectDecodes(averagePool(composedRaster(blob), k), blob);
    }
  });

  it("⑪ 非整数スケール（×0.53 バイリニア）後も復元できる", () => {
    const blob = sampleBlob();
    expectDecodes(scaleBilinear(composedRaster(blob), 0.53), blob);
  });

  it("⑫ 輝度シフト（±40）・コントラスト低下後も復元できる", () => {
    const blob = sampleBlob();
    expectDecodes(brightness(composedRaster(blob), 40), blob);
    expectDecodes(brightness(composedRaster(blob), -40), blob);
    expectDecodes(reduceContrast(composedRaster(blob), 0.5), blob);
  });

  it("⑬ 3×3 box blur ×2 後も復元できる", () => {
    const blob = sampleBlob();
    expectDecodes(boxBlur3(composedRaster(blob), 2), blob);
  });

  it("⑭ JPEG q=70 再圧縮後も復元できる", () => {
    const blob = sampleBlob();
    expectDecodes(jpegRoundtrip(composedRaster(blob), 70), blob);
  });

  it("⑭ JPEG q=50 + 50% 縮小（SNS 劣化想定・RS 要否の判断ゲート）でも復元できる", () => {
    const blob = sampleBlob();
    const degraded = jpegRoundtrip(
      scaleBilinear(jpegRoundtrip(composedRaster(blob), 70), 0.5),
      50,
    );
    expectDecodes(degraded, blob);
  });

  it("⑮ 乱数ノイズ画像は型付きエラーで失敗する（ゴミを返さない）", () => {
    const noise = noiseRaster(640, 800, 42);
    expect(() => decodeBarcode(grayFromRaster(noise))).toThrow(
      BarcodeDecodeError,
    );
    try {
      decodeBarcode(grayFromRaster(noise));
    } catch (error) {
      expect((error as BarcodeDecodeError).code).toBe("PATTERN_NOT_FOUND");
    }
  });

  it("⑯ 180° 回転画像は自動補正して復元できる", () => {
    const blob = sampleBlob();
    expectDecodes(rotate180Raster(composedRaster(blob)), blob);
  });

  it("小さすぎる画像は IMAGE_TOO_SMALL", () => {
    const tiny = noiseRaster(60, 60, 1);
    try {
      decodeBarcode(grayFromRaster(tiny));
      expect.unreachable();
    } catch (error) {
      expect((error as BarcodeDecodeError).code).toBe("IMAGE_TOO_SMALL");
    }
  });
});
