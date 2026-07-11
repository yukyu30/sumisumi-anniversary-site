import type { Raster } from "./rasterize";

/**
 * グレースケール画像への読み取りアクセス抽象。
 * ImageData（ブラウザ）とテスト用ラスタの両方をここに載せることで、
 * デコーダを DOM 非依存の純粋関数に保つ。
 */
export interface GraySampler {
  width: number;
  height: number;
  /** (x, y) の輝度 0–255。範囲外は最近傍にクランプ */
  at(x: number, y: number): number;
}

/** RGBA バッファ（ImageData.data 互換）から BT.601 luma のサンプラーを作る */
export function grayFromRGBA(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): GraySampler {
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;
    gray[i] =
      0.299 * pixels[offset] +
      0.587 * pixels[offset + 1] +
      0.114 * pixels[offset + 2];
  }
  return {
    width,
    height,
    at(x, y) {
      const cx = x < 0 ? 0 : x >= width ? width - 1 : x | 0;
      const cy = y < 0 ? 0 : y >= height ? height - 1 : y | 0;
      return gray[cy * width + cx];
    },
  };
}

export function grayFromRaster(raster: Raster): GraySampler {
  return grayFromRGBA(raster.pixels, raster.width, raster.height);
}

/** 180° 回転ビュー（コピーせずに座標変換だけ行う） */
export function rotate180(sampler: GraySampler): GraySampler {
  return {
    width: sampler.width,
    height: sampler.height,
    at(x, y) {
      return sampler.at(sampler.width - 1 - x, sampler.height - 1 - y);
    },
  };
}
