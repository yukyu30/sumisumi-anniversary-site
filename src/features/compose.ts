/**
 * 記念画像の Canvas 合成（ブラウザ専用の薄い接着層）。
 * ロジック（暗号・バーコード）は src/lib の純粋関数に委譲し、
 * ここでは描画だけを行う。
 */
import { encodeBarcode } from "@/lib/barcode/encode";
import { rasterize } from "@/lib/barcode/rasterize";
import { frameContainer } from "@/lib/container";
import { formatJst } from "@/lib/format";

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 1600;
/** 1280 / 64 モジュール = 20px/モジュール → ストリップは 1280×360 */
const MODULE_SCALE = 20;
const STRIP_HEIGHT = 18 * MODULE_SCALE;

export interface ComposeInput {
  /** /api/issue が返した base64 暗号ブロブ */
  payload: string;
  /** サーバー発行時刻（unix 秒） */
  issuedAt: number;
  id: string;
  years: number;
  file: File;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** next/font が CSS 変数に入れたフォントファミリーを取り出す */
function serifFamily(): string {
  const family = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-shippori-mincho")
    .trim();
  return family || '"Hiragino Mincho ProN", "Yu Mincho", serif';
}

async function ensureFonts(family: string): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load(`700 112px ${family}`, "祝周年0123456789"),
      document.fonts.load(`500 40px ${family}`, "墨澄記念証"),
    ]);
  } catch {
    // フォントが読めなくてもフォールバックで描画は続行できる
  }
}

/** 写真を cover-fit で描く */
function drawCover(
  ctx: CanvasRenderingContext2D,
  image: ImageBitmap,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  const scale = Math.max(dw / image.width, dh / image.height);
  const sw = dw / scale;
  const sh = dh / scale;
  const sx = (image.width - sw) / 2;
  const sy = (image.height - sh) / 2;
  ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
}

/** 墨のかすれを模した太い横線 */
function drawInkStroke(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  width: number,
): void {
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const offset = (i - 2) * 2.2;
    ctx.strokeStyle = `rgba(28, 25, 23, ${0.16 - Math.abs(i - 2) * 0.03})`;
    ctx.lineWidth = 8 - Math.abs(i - 2) * 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx - width / 2, y + offset);
    ctx.quadraticCurveTo(cx, y + offset - 3, cx + width / 2, y + offset + 1);
    ctx.stroke();
  }
  ctx.restore();
}

/** 落款（らっかん）風の朱印 */
function drawSeal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  family: string,
): void {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate((-2.5 * Math.PI) / 180);
  ctx.fillStyle = "#b03a2e";
  ctx.beginPath();
  ctx.roundRect(-size / 2, -size / 2, size, size, size * 0.12);
  ctx.fill();
  ctx.fillStyle = "#f7f4ec";
  ctx.font = `700 ${size * 0.42}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("墨", 0, -size * 0.22);
  ctx.fillText("澄", 0, size * 0.24);
  ctx.restore();
}

/**
 * 発行データと写真から記念画像 (PNG) を合成する。
 * 上部 360px はバーコードストリップ（検証に使う）なので触らないこと。
 */
export async function composeAnniversaryImage(
  input: ComposeInput,
): Promise<Blob> {
  const blob = base64ToBytes(input.payload);
  const strip = rasterize(encodeBarcode(frameContainer(blob)), MODULE_SCALE);
  const photo = await createImageBitmap(input.file);
  const family = serifFamily();
  await ensureFonts(family);

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D コンテキストを取得できません");

  // 和紙風の背景
  ctx.fillStyle = "#f7f4ec";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // バーコードストリップ（画像上部の白黒もよう）
  ctx.putImageData(
    new ImageData(
      strip.pixels as Uint8ClampedArray<ArrayBuffer>,
      strip.width,
      strip.height,
    ),
    0,
    0,
  );

  // ストリップ下の墨の区切り線
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(0, STRIP_HEIGHT, CANVAS_WIDTH, 6);

  // 写真（墨の額縁つき）
  const photoRect = { x: 100, y: 440, w: 1080, h: 760 } as const;
  ctx.save();
  ctx.shadowColor = "rgba(28, 25, 23, 0.35)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#1c1917";
  ctx.fillRect(
    photoRect.x - 14,
    photoRect.y - 14,
    photoRect.w + 28,
    photoRect.h + 28,
  );
  ctx.restore();
  drawCover(ctx, photo, photoRect.x, photoRect.y, photoRect.w, photoRect.h);
  photo.close();

  // タイトル「祝 N周年」
  ctx.fillStyle = "#1c1917";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 112px ${family}`;
  ctx.fillText(`祝 ${input.years}周年`, CANVAS_WIDTH / 2, 1330);
  drawInkStroke(ctx, CANVAS_WIDTH / 2, 1356, 620);

  // ID と発行日時
  ctx.font = `500 44px ${family}`;
  ctx.fillText(input.id, CANVAS_WIDTH / 2, 1440);
  ctx.font = `500 30px ${family}`;
  ctx.fillStyle = "#44403c";
  ctx.fillText(
    `${formatJst(input.issuedAt)} 発行 ・ 墨澄 -SumiSumi- 周年記念証`,
    CANVAS_WIDTH / 2,
    1508,
  );

  // 落款
  drawSeal(ctx, photoRect.x + photoRect.w - 108, photoRect.y + photoRect.h - 108, 96, family);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(new Error("PNG の書き出しに失敗しました")),
      "image/png",
    );
  });
}
