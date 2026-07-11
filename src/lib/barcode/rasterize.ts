import type { BitMatrix } from "./encode";

export interface Raster {
  width: number;
  height: number;
  /** RGBA、ImageData.data と互換 */
  pixels: Uint8ClampedArray;
}

/**
 * BitMatrix を RGBA バッファに描画する（純粋関数、Canvas 非依存）。
 * 黒 = (0,0,0,255)、白 = (255,255,255,255)。
 */
export function rasterize(matrix: BitMatrix, scale: number): Raster {
  if (!Number.isInteger(scale) || scale < 1) {
    throw new RangeError(`scale は 1 以上の整数が必要: ${scale}`);
  }
  const rows = matrix.length;
  const cols = matrix[0].length;
  const width = cols * scale;
  const height = rows * scale;
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    const row = matrix[(y / scale) | 0];
    for (let x = 0; x < width; x++) {
      const value = row[(x / scale) | 0] ? 0 : 255;
      const offset = (y * width + x) * 4;
      pixels[offset] = value;
      pixels[offset + 1] = value;
      pixels[offset + 2] = value;
      pixels[offset + 3] = 255;
    }
  }
  return { width, height, pixels };
}
