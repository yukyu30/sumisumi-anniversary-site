import { describe, expect, it } from "vitest";
import { encodeBarcode } from "./encode";
import { rasterize } from "./rasterize";

const MATRIX = encodeBarcode(new Uint8Array([1, 2, 3]));

describe("barcode rasterize", () => {
  it("scale=20 で 1280×360 の RGBA バッファになる", () => {
    const raster = rasterize(MATRIX, 20);
    expect(raster.width).toBe(1280);
    expect(raster.height).toBe(360);
    expect(raster.pixels.length).toBe(1280 * 360 * 4);
  });

  it("ピクセルは黒 (0) か白 (255) の二値、アルファは 255", () => {
    const raster = rasterize(MATRIX, 4);
    for (let i = 0; i < raster.pixels.length; i += 4) {
      const [r, g, b, a] = raster.pixels.subarray(i, i + 4);
      expect(r === 0 || r === 255).toBe(true);
      expect(g).toBe(r);
      expect(b).toBe(r);
      expect(a).toBe(255);
    }
  });

  it("モジュールとピクセルが対応する（scale=2 の左上 quiet は白、(1,1) ファインダーは黒）", () => {
    const raster = rasterize(MATRIX, 2);
    const px = (x: number, y: number) => raster.pixels[(y * raster.width + x) * 4];
    // (0,0) モジュール = quiet = 白
    expect(px(0, 0)).toBe(255);
    expect(px(1, 1)).toBe(255);
    // (1,1) モジュール = TL ファインダー = 黒 → ピクセル (2,2)–(3,3)
    expect(px(2, 2)).toBe(0);
    expect(px(3, 3)).toBe(0);
  });

  it("scale=1 でも動く / 非整数・0 の scale は例外", () => {
    const raster = rasterize(MATRIX, 1);
    expect(raster.width).toBe(64);
    expect(raster.height).toBe(18);
    expect(() => rasterize(MATRIX, 0)).toThrow(RangeError);
    expect(() => rasterize(MATRIX, 1.5)).toThrow(RangeError);
  });
});
