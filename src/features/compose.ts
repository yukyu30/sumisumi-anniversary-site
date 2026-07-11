/**
 * 記念画像の Canvas 合成（ブラウザ専用の薄い接着層）。
 * ロジック（暗号・バーコード）は src/lib の純粋関数に委譲し、
 * ここでは描画だけを行う。
 */
import { encodeBarcode } from "@/lib/barcode/encode";
import { rasterize } from "@/lib/barcode/rasterize";
import { frameContainer } from "@/lib/container";
import { formatJst } from "@/lib/format";

export type FrameColor = "blue" | "orange";

export const CANVAS_WIDTH = 1280;
/** 1280 / 64 モジュール = 20px/モジュール → ストリップは 1280×360 */
const MODULE_SCALE = 20;
const STRIP_HEIGHT = 18 * MODULE_SCALE; // 360
/** 写真 + フレームの正方形領域 */
const SQUARE = CANVAS_WIDTH; // 1280
const FOOTER_HEIGHT = 150;
export const CANVAS_HEIGHT = STRIP_HEIGHT + SQUARE + FOOTER_HEIGHT; // 1790

/** フレーム色ごとのテーマ（フレーム PNG のリボン色に合わせる） */
const THEMES: Record<
  FrameColor,
  { ink: string; sub: string; frameSrc: string }
> = {
  blue: { ink: "#2f63e8", sub: "#5b6b8c", frameSrc: "/frames/blue.png" },
  orange: { ink: "#f0971b", sub: "#a5824a", frameSrc: "/frames/orange.png" },
};

export interface ComposeInput {
  /** /api/issue が返した base64 暗号ブロブ */
  payload: string;
  /** サーバー発行時刻（unix 秒） */
  issuedAt: number;
  id: string;
  years: number;
  frameColor: FrameColor;
  file: File;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** next/font が CSS 変数に入れたゴシックのフォントファミリーを取り出す */
function sansFamily(): string {
  const family = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-sans")
    .trim();
  return family || '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';
}

async function ensureFonts(family: string): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load(`700 46px ${family}`, "墨澄記念証周年"),
      document.fonts.load(`500 28px ${family}`, "0123456789年月日発行"),
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

/** フレーム PNG を読み込む。未配置（404）なら null を返してフォールバックする */
async function loadFrame(src: string): Promise<ImageBitmap | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    return await createImageBitmap(await res.blob());
  } catch {
    return null;
  }
}

/**
 * 発行データと写真から記念画像 (PNG) を合成する。
 * 上部 360px はバーコードストリップ（検証に使う）なので触らないこと。
 */
export async function composeAnniversaryImage(
  input: ComposeInput,
): Promise<Blob> {
  const theme = THEMES[input.frameColor];
  const blob = base64ToBytes(input.payload);
  const strip = rasterize(encodeBarcode(frameContainer(blob)), MODULE_SCALE);
  const [photo, frame] = await Promise.all([
    createImageBitmap(input.file),
    loadFrame(theme.frameSrc),
  ]);
  const family = sansFamily();
  await ensureFonts(family);

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D コンテキストを取得できません");

  // 背景（白）
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // バーコードストリップ（画像上部の白黒もよう＝検証用）
  ctx.putImageData(
    new ImageData(
      strip.pixels as Uint8ClampedArray<ArrayBuffer>,
      strip.width,
      strip.height,
    ),
    0,
    0,
  );

  // ストリップ下のテーマ色の区切り線
  ctx.fillStyle = theme.ink;
  ctx.fillRect(0, STRIP_HEIGHT, CANVAS_WIDTH, 6);

  // 写真（正方形に cover-fit）
  const squareTop = STRIP_HEIGHT + 6;
  drawCover(ctx, photo, 0, squareTop, SQUARE, SQUARE - 6);
  photo.close();

  // フレーム PNG を写真の上に重ねる（透過部分から写真が見える）
  if (frame) {
    ctx.drawImage(frame, 0, squareTop, SQUARE, SQUARE);
    frame.close();
  }

  // フッター: ID と発行日時
  const footerY = STRIP_HEIGHT + SQUARE;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, footerY, CANVAS_WIDTH, FOOTER_HEIGHT);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = theme.ink;
  ctx.font = `700 46px ${family}`;
  ctx.fillText(input.id, CANVAS_WIDTH / 2, footerY + 66);
  ctx.fillStyle = theme.sub;
  ctx.font = `500 28px ${family}`;
  ctx.fillText(
    `${formatJst(input.issuedAt)} 発行 ・ 墨澄 -SumiSumi- 周年記念証`,
    CANVAS_WIDTH / 2,
    footerY + 112,
  );

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
