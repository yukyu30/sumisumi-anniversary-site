/**
 * テスト専用の画像劣化ヘルパー。
 * SNS 投稿で起きる再圧縮・リサイズ・色調変化を Node 上で再現する。
 */
import * as jpeg from "jpeg-js";
import type { Raster } from "./rasterize";

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

/** バイリニア補間でのリサイズ（非整数倍率対応） */
export function scaleBilinear(raster: Raster, factor: number): Raster {
  const width = Math.max(1, Math.round(raster.width * factor));
  const height = Math.max(1, Math.round(raster.height * factor));
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const sy = ((y + 0.5) / height) * raster.height - 0.5;
    const y0 = Math.max(0, Math.floor(sy));
    const y1 = Math.min(raster.height - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < width; x++) {
      const sx = ((x + 0.5) / width) * raster.width - 0.5;
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(raster.width - 1, x0 + 1);
      const fx = sx - x0;
      for (let ch = 0; ch < 4; ch++) {
        const p00 = raster.pixels[(y0 * raster.width + x0) * 4 + ch];
        const p01 = raster.pixels[(y0 * raster.width + x1) * 4 + ch];
        const p10 = raster.pixels[(y1 * raster.width + x0) * 4 + ch];
        const p11 = raster.pixels[(y1 * raster.width + x1) * 4 + ch];
        const top = p00 * (1 - fx) + p01 * fx;
        const bottom = p10 * (1 - fx) + p11 * fx;
        pixels[(y * width + x) * 4 + ch] = clamp255(
          Math.round(top * (1 - fy) + bottom * fy),
        );
      }
    }
  }
  return { width, height, pixels };
}

/** k×k 平均プーリング（整数縮小） */
export function averagePool(raster: Raster, k: number): Raster {
  const width = Math.floor(raster.width / k);
  const height = Math.floor(raster.height / k);
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let ch = 0; ch < 4; ch++) {
        let sum = 0;
        for (let dy = 0; dy < k; dy++) {
          for (let dx = 0; dx < k; dx++) {
            sum +=
              raster.pixels[((y * k + dy) * raster.width + (x * k + dx)) * 4 + ch];
          }
        }
        pixels[(y * width + x) * 4 + ch] = Math.round(sum / (k * k));
      }
    }
  }
  return { width, height, pixels };
}

/** 輝度シフト */
export function brightness(raster: Raster, delta: number): Raster {
  const pixels = new Uint8ClampedArray(raster.pixels.length);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = clamp255(raster.pixels[i] + delta);
    pixels[i + 1] = clamp255(raster.pixels[i + 1] + delta);
    pixels[i + 2] = clamp255(raster.pixels[i + 2] + delta);
    pixels[i + 3] = raster.pixels[i + 3];
  }
  return { ...raster, pixels };
}

/** コントラスト低下（128 中心に factor 倍へ圧縮） */
export function reduceContrast(raster: Raster, factor: number): Raster {
  const pixels = new Uint8ClampedArray(raster.pixels.length);
  for (let i = 0; i < pixels.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      pixels[i + ch] = clamp255(
        Math.round(128 + (raster.pixels[i + ch] - 128) * factor),
      );
    }
    pixels[i + 3] = raster.pixels[i + 3];
  }
  return { ...raster, pixels };
}

/** 3×3 box blur を times 回 */
export function boxBlur3(raster: Raster, times: number): Raster {
  let current = raster;
  for (let t = 0; t < times; t++) {
    const pixels = new Uint8ClampedArray(current.pixels.length);
    const { width, height } = current;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (let ch = 0; ch < 4; ch++) {
          let sum = 0;
          let count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
              sum += current.pixels[(ny * width + nx) * 4 + ch];
              count++;
            }
          }
          pixels[(y * width + x) * 4 + ch] = Math.round(sum / count);
        }
      }
    }
    current = { width, height, pixels };
  }
  return current;
}

/** jpeg-js での encode→decode ラウンドトリップ（再圧縮劣化） */
export function jpegRoundtrip(raster: Raster, quality: number): Raster {
  const encoded = jpeg.encode(
    { data: Buffer.from(raster.pixels), width: raster.width, height: raster.height },
    quality,
  );
  const decoded = jpeg.decode(encoded.data, { useTArray: true });
  return {
    width: decoded.width,
    height: decoded.height,
    pixels: new Uint8ClampedArray(decoded.data),
  };
}

/** 180° 回転 */
export function rotate180Raster(raster: Raster): Raster {
  const { width, height } = raster;
  const pixels = new Uint8ClampedArray(raster.pixels.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 4;
      const dst = ((height - 1 - y) * width + (width - 1 - x)) * 4;
      pixels.set(raster.pixels.subarray(src, src + 4), dst);
    }
  }
  return { width, height, pixels };
}

/** 決定的な乱数ノイズ画像 */
export function noiseRaster(width: number, height: number, seed: number): Raster {
  const pixels = new Uint8ClampedArray(width * height * 4);
  let x = seed >>> 0;
  for (let i = 0; i < pixels.length; i += 4) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    const v = x & 0xff;
    pixels[i] = v;
    pixels[i + 1] = (x >> 8) & 0xff;
    pixels[i + 2] = (x >> 16) & 0xff;
    pixels[i + 3] = 255;
  }
  return { width, height, pixels };
}

/** ストリップの下に本文領域を継ぎ足し、合成後の縦長画像を模す */
export function padBelow(raster: Raster, extraHeight: number, gray: number): Raster {
  const height = raster.height + extraHeight;
  const pixels = new Uint8ClampedArray(raster.width * height * 4);
  pixels.set(raster.pixels, 0);
  for (let i = raster.pixels.length; i < pixels.length; i += 4) {
    pixels[i] = gray;
    pixels[i + 1] = gray;
    pixels[i + 2] = gray;
    pixels[i + 3] = 255;
  }
  return { width: raster.width, height, pixels };
}
