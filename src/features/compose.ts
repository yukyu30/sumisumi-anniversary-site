/**
 * 記念画像の Canvas 合成（ブラウザ専用の薄い接着層）。
 * 写真を白フチのチェキ風カードに収め、写真の上にフレーム（リボン）を重ね、
 * 写真の外・下の余白に QR コードとハッシュタグ #Sumi3D を焼き込む。
 */
import QRCode from "qrcode";

export type FrameColor = "blue" | "orange";

export const HASHTAG = "#Sumi3D";

/** チェキ余白（写真幅に対する割合）: 上・左右 / 下 */
export const CHEKI = { border: 0.04, bottom: 0.2 };

const FRAME_SRC: Record<FrameColor, string> = {
  blue: "/frames/blue.png",
  orange: "/frames/orange.png",
};

/** リボンの配置（写真基準の正規化）: 中心 (cx, cy) と幅（写真幅に対する割合） */
export interface FramePlacement {
  cx: number;
  cy: number;
  size: number;
}

export interface ComposeInput {
  /** /api/issue が返した base64 暗号ブロブ（QR に埋め込む） */
  payload: string;
  /** チェキ下部に表示する ID */
  id: string;
  frameColor: FrameColor;
  frame: FramePlacement;
  file: File;
}

/** QR に埋め込む検証 URL */
export function verifyUrl(payload: string): string {
  const origin =
    typeof location !== "undefined" ? location.origin : "https://example.com";
  return `${origin}/verify?t=${encodeURIComponent(payload)}`;
}

async function loadFrame(color: FrameColor): Promise<ImageBitmap | null> {
  try {
    const res = await fetch(FRAME_SRC[color]);
    if (!res.ok) return null;
    return await createImageBitmap(await res.blob());
  } catch {
    return null;
  }
}

async function makeQrCanvas(text: string, size: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, text, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });
  return canvas;
}

function fontFamily(varName: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return v || fallback;
}

/**
 * 記念画像 (PNG) を合成する。出力はチェキ風カード（写真＋白フチ＋下部キャプション）。
 */
export async function composeAnniversaryImage(
  input: ComposeInput,
): Promise<Blob> {
  const [photo, frame] = await Promise.all([
    createImageBitmap(input.file),
    loadFrame(input.frameColor),
  ]);

  const W = photo.width;
  const H = photo.height;
  const b = Math.round(W * CHEKI.border);
  const bottomH = Math.round(W * CHEKI.bottom);
  const cardW = W + b * 2;
  const cardH = b + H + bottomH;

  const canvas = document.createElement("canvas");
  canvas.width = cardW;
  canvas.height = cardH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D コンテキストを取得できません");

  // 白いカード
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cardW, cardH);

  // 写真
  ctx.drawImage(photo, b, b, W, H);
  photo.close();

  // フレーム（リボン）は写真の上だけ（はみ出しはクリップ）
  if (frame) {
    const fw = input.frame.size * W;
    const fh = fw * (frame.height / frame.width);
    const fx = b + input.frame.cx * W - fw / 2;
    const fy = b + input.frame.cy * H - fh / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(b, b, W, H);
    ctx.clip();
    ctx.drawImage(frame, fx, fy, fw, fh);
    ctx.restore();
    frame.close();
  }

  // 写真のふち（うっすら）
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = Math.max(1, Math.round(W * 0.002));
  ctx.strokeRect(b, b, W, H);

  // 下の余白: QR（右）と ハッシュタグ + ID（左）
  const bottomY = b + H;
  const wordmark = fontFamily("--font-wordmark", "sans-serif");
  const sans = fontFamily("--font-sans", "sans-serif");
  await Promise.all([
    document.fonts
      .load(`700 ${Math.round(bottomH * 0.3)}px ${wordmark}`, HASHTAG)
      .catch(() => {}),
    document.fonts
      .load(`500 ${Math.round(bottomH * 0.22)}px ${sans}`, input.id)
      .catch(() => {}),
  ]);

  const qrSize = Math.round(bottomH * 0.82);
  const qrX = cardW - b - qrSize;
  const qrY = bottomY + (bottomH - qrSize) / 2;
  const qr = await makeQrCanvas(verifyUrl(input.payload), qrSize);
  ctx.drawImage(qr, qrX, qrY);

  const leftX = b * 1.6;
  const maxTextW = qrX - leftX - b;
  const fit = (text: string, target: number, weight: number, family: string) => {
    ctx.font = `${weight} ${target}px ${family}`;
    const w = ctx.measureText(text).width;
    return w > maxTextW ? Math.floor((target * maxTextW) / w) : target;
  };
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  // ハッシュタグ
  ctx.fillStyle = "#1c1917";
  ctx.font = `700 ${fit(HASHTAG, Math.round(bottomH * 0.3), 700, wordmark)}px ${wordmark}`;
  ctx.fillText(HASHTAG, leftX, bottomY + bottomH * 0.38);
  // ID
  if (input.id) {
    ctx.fillStyle = "#6b7280";
    ctx.font = `500 ${fit(input.id, Math.round(bottomH * 0.22), 500, sans)}px ${sans}`;
    ctx.fillText(input.id, leftX, bottomY + bottomH * 0.72);
  }

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
