"use client";

import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";
import { VerifiedCheki } from "./VerifiedCheki";
import { VerifyResult, type VerifyOutcome } from "./VerifyResult";

/** 画像の一部（sx,sy,sw,sh）を長辺 target px に描いて ImageData を得る */
function regionImageData(
  bitmap: ImageBitmap,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  target: number,
): ImageData {
  const scale = Math.min(target / Math.max(sw, sh), 4);
  const width = Math.max(1, Math.round(sw * scale));
  const height = Math.max(1, Math.round(sh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no ctx");
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

/**
 * 画像から QR を読み取る。まず全体、見つからなければ QR がある右下領域を
 * 拡大して再スキャン（大きな写真の隅の小さな QR に強くする）。
 */
async function readQrFromFile(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  try {
    const W = bitmap.width;
    const H = bitmap.height;
    const attempts: [number, number, number, number, number][] = [
      [0, 0, W, H, 1600], // 全体
      [W * 0.35, H * 0.55, W * 0.65, H * 0.45, 900], // 右下（チェキの QR 位置）
      [W * 0.5, H * 0.7, W * 0.5, H * 0.3, 800], // さらに寄せる
    ];
    for (const [sx, sy, sw, sh, target] of attempts) {
      const img = regionImageData(bitmap, sx, sy, sw, sh, target);
      const found = jsQR(img.data, img.width, img.height);
      if (found?.data) return found.data;
    }
    return null;
  } finally {
    bitmap.close();
  }
}

/** QR に埋まった文字列（検証 URL）から payload を取り出す */
function extractPayload(text: string): string | null {
  try {
    const url = new URL(text);
    const t = url.searchParams.get("t");
    if (t) return t;
  } catch {
    // URL でなければそのまま payload とみなす
  }
  return text || null;
}

async function verifyPayload(payload: string): Promise<VerifyOutcome> {
  const res = await fetch("/api/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ payload }),
  });
  const body = (await res.json()) as {
    id?: string;
    years?: number;
    issuedAt?: number;
    error?: string;
  };
  if (
    !res.ok ||
    body.id === undefined ||
    body.years === undefined ||
    body.issuedAt === undefined
  ) {
    return { ok: false, message: body.error ?? "検証に失敗しました" };
  }
  return { ok: true, id: body.id, years: body.years, issuedAt: body.issuedAt };
}

/** 画像から QR を読み取り、サーバー検証まで行う。t 指定時は自動検証 */
export function VerifyDropzone({ token }: { token?: string }) {
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const imageRef = useRef<string | null>(null);

  const setImage = (url: string | null) => {
    if (imageRef.current) URL.revokeObjectURL(imageRef.current);
    imageRef.current = url;
    setImageUrl(url);
  };
  useEffect(() => () => setImage(null), []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    setBusy(true);
    verifyPayload(token)
      .then((o) => active && setOutcome(o))
      .finally(() => active && setBusy(false));
    return () => {
      active = false;
    };
  }, [token]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setOutcome(null);
    setImage(null);
    try {
      const qrText = await readQrFromFile(file);
      const payload = qrText ? extractPayload(qrText) : null;
      if (!payload) {
        setOutcome({
          ok: false,
          message:
            "QR コードが見つかりません。このサイトで生成した画像をお試しください",
        });
        return;
      }
      const result = await verifyPayload(payload);
      setOutcome(result);
      if (result.ok) setImage(URL.createObjectURL(file));
    } catch {
      setOutcome({
        ok: false,
        message: "画像の読み込みに失敗しました。別の画像でお試しください",
      });
    } finally {
      setBusy(false);
    }
  }

  const loaded = outcome !== null || imageUrl !== null;
  const buttonLabel = busy
    ? "解析中…"
    : loaded
      ? "別の画像を読み込む"
      : "記念画像を読み込む";

  return (
    <div className="flex flex-col items-center gap-8">
      <label
        htmlFor="verify-image"
        className={`inline-block rounded-full px-8 py-3.5 font-bold transition ${
          busy
            ? "pointer-events-none bg-zinc-200 text-zinc-400"
            : "cursor-pointer bg-brand-blue text-white hover:bg-brand-blue-dark"
        }`}
      >
        {buttonLabel}
        <input
          id="verify-image"
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {outcome &&
        (outcome.ok && imageUrl ? (
          <VerifiedCheki
            imageUrl={imageUrl}
            id={outcome.id}
            years={outcome.years}
            issuedAt={outcome.issuedAt}
          />
        ) : (
          <VerifyResult outcome={outcome} />
        ))}
    </div>
  );
}
