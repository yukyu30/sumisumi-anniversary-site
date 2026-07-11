/**
 * File → GraySampler の変換（ブラウザ専用の薄い接着層）。
 * ピクセル解析は src/lib/barcode の純粋関数に委譲する。
 */
import { type GraySampler, grayFromRGBA } from "@/lib/barcode/sampler";

/** 巨大画像の暴走を防ぐ上限（長辺） */
const MAX_DIMENSION = 4096;

export async function readImageAsSampler(file: File): Promise<GraySampler> {
  const bitmap = await createImageBitmap(file);
  try {
    let { width, height } = bitmap;
    if (Math.max(width, height) > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D コンテキストを取得できません");
    ctx.drawImage(bitmap, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    return grayFromRGBA(imageData.data, width, height);
  } finally {
    bitmap.close();
  }
}
