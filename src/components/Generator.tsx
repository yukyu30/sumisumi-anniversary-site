"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import {
  CHEKI,
  composeAnniversaryImage,
  type FrameColor,
  type FramePlacement,
  HASHTAG,
  verifyUrl,
} from "@/features/compose";
import { MAX_ID_BYTES } from "@/lib/payload";

const FRAME_OPTIONS: { value: FrameColor; label: string; swatch: string }[] = [
  { value: "blue", label: "青", swatch: "#2f63e8" },
  { value: "orange", label: "オレンジ", swatch: "#f0971b" },
];

const FRAME_PNG: Record<FrameColor, string> = {
  blue: "/frames/blue.png",
  orange: "/frames/orange.png",
};

// 横長リボンなので、既定は下寄せ・やや小さめ
const DEFAULT_FRAME: FramePlacement = { cx: 0.5, cy: 0.82, size: 0.92 };
// フレーム PNG のアスペクト比（幅 / 高さ, 1947×436）
const FRAME_ASPECT = 1947 / 436;

type DragMode = "move" | "resize";
interface Drag {
  mode: DragMode;
  px: number;
  py: number;
  start: FramePlacement;
  /** resize 時: フレーム中心（clientX/Y）からの初期距離 */
  startDist: number;
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function Generator() {
  const [id, setId] = useState("");
  const [frameColor, setFrameColor] = useState<FrameColor>("blue");
  const [file, setFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoAspect, setPhotoAspect] = useState(1);
  const [frame, setFrame] = useState<FramePlacement>(DEFAULT_FRAME);
  const [issued, setIssued] = useState<{ payload: string; issuedAt: number } | null>(
    null,
  );
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  const normalizedId = id.normalize("NFC").trim();
  const idBytes = new TextEncoder().encode(normalizedId).length;
  const idTooLong = idBytes > MAX_ID_BYTES;
  const idValid = idBytes >= 1 && !idTooLong;
  const ready = Boolean(photoUrl && issued);

  // 写真の Object URL と実寸
  useEffect(() => {
    if (!file) {
      setPhotoUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setFrame(DEFAULT_FRAME);
    const img = new Image();
    img.onload = () => setPhotoAspect(img.width / img.height || 1);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ID が変わったらデバウンスして払い出し
  useEffect(() => {
    setError(null);
    if (!idValid) {
      setIssued(null);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/issue", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: normalizedId }),
        });
        const body = (await res.json()) as {
          payload?: string;
          issuedAt?: number;
          error?: string;
        };
        if (!active) return;
        if (res.ok && body.payload && body.issuedAt !== undefined) {
          setIssued({ payload: body.payload, issuedAt: body.issuedAt });
        } else {
          setIssued(null);
          setError(body.error ?? "うまく作れませんでした。時間をおいて試してください");
        }
      } catch {
        if (active) setError("通信に失敗しました");
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [normalizedId, idValid]);

  // プレビュー用の QR
  useEffect(() => {
    if (!issued) {
      setQrUrl(null);
      return;
    }
    let active = true;
    QRCode.toDataURL(verifyUrl(issued.payload), {
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#111111", light: "#ffffff" },
    })
      .then((url) => active && setQrUrl(url))
      .catch(() => active && setQrUrl(null));
    return () => {
      active = false;
    };
  }, [issued]);

  function onPointerDown(mode: DragMode, e: React.PointerEvent) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = photoRef.current?.getBoundingClientRect();
    let startDist = 1;
    if (mode === "resize" && rect) {
      const centerX = rect.left + frame.cx * rect.width;
      const centerY = rect.top + frame.cy * rect.height;
      startDist =
        Math.hypot(e.clientX - centerX, e.clientY - centerY) || 1;
    }
    dragRef.current = {
      mode,
      px: e.clientX,
      py: e.clientY,
      start: { ...frame },
      startDist,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    const rect = photoRef.current?.getBoundingClientRect();
    if (!d || !rect) return;
    if (d.mode === "move") {
      const dx = (e.clientX - d.px) / rect.width;
      const dy = (e.clientY - d.py) / rect.height;
      setFrame({
        ...d.start,
        cx: clamp(d.start.cx + dx, 0, 1),
        cy: clamp(d.start.cy + dy, 0, 1),
      });
    } else {
      // 四隅どこでも中心からの距離比でサイズ変更
      const centerX = rect.left + d.start.cx * rect.width;
      const centerY = rect.top + d.start.cy * rect.height;
      const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
      setFrame({
        ...d.start,
        size: clamp((d.start.size * dist) / d.startDist, 0.2, 2.4),
      });
    }
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  async function handleDownload() {
    if (!file || !issued) return;
    setDownloading(true);
    try {
      const blob = await composeAnniversaryImage({
        payload: issued.payload,
        id: normalizedId,
        frameColor,
        frame,
        file,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sumisumi-2nd-${normalizedId || "anniversary"}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("画像の作成に失敗しました");
    } finally {
      setDownloading(false);
    }
  }

  // フレーム（リボン）の写真内での表示位置（%）
  const heightFrac = (frame.size * photoAspect) / FRAME_ASPECT;
  const framePct = {
    width: frame.size * 100,
    height: heightFrac * 100,
    left: (frame.cx - frame.size / 2) * 100,
    top: (frame.cy - heightFrac / 2) * 100,
  };

  // チェキ・カードのレイアウト（写真幅を 1 とした単位で計算）
  const hU = 1 / photoAspect;
  const cardWU = 1 + 2 * CHEKI.border;
  const cardHU = CHEKI.border + hU + CHEKI.bottom;
  const cardAspect = cardWU / cardHU;
  const photoBox = {
    left: (CHEKI.border / cardWU) * 100,
    top: (CHEKI.border / cardHU) * 100,
    width: (1 / cardWU) * 100,
    height: (hU / cardHU) * 100,
  };
  const captionBox = {
    top: ((CHEKI.border + hU) / cardHU) * 100,
    height: (CHEKI.bottom / cardHU) * 100,
    padX: (CHEKI.border / cardWU) * 100,
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="gen-id" className="text-sm font-bold">
            ID（VRChat ID・X の ID など）
          </label>
          <input
            id="gen-id"
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="例: sumisumi_fan"
            className="rounded-xl border-2 border-zinc-200 bg-white px-4 py-2.5 font-medium text-zinc-900 focus:border-brand-blue focus:outline-none"
          />
          {idTooLong && (
            <p role="alert" className="text-sm font-bold text-red-600">
              ID は UTF-8 で {MAX_ID_BYTES} バイト以内にしてください
            </p>
          )}
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-bold">フレームの色</legend>
          <div className="mt-1 flex gap-3">
            {FRAME_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2 rounded-full border-2 px-5 py-2 font-bold transition ${
                  frameColor === opt.value
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-700"
                }`}
              >
                <input
                  type="radio"
                  name="frameColor"
                  value={opt.value}
                  checked={frameColor === opt.value}
                  onChange={() => setFrameColor(opt.value)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className="h-4 w-4 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: opt.swatch }}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="gen-image" className="text-sm font-bold">
            画像（記念に使う写真・スクリーンショット）
          </label>
          <input
            id="gen-image"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm font-medium file:mr-3 file:rounded-full file:border-0 file:bg-brand-blue file:px-4 file:py-2 file:font-bold file:text-white"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm font-bold text-red-600">
            {error}
          </p>
        )}
      </div>

      {/* エディタ / プレビュー */}
      <div className="flex flex-col items-center gap-4">
        {photoUrl ? (
          <>
            <p className="text-xs font-bold text-zinc-400">
              フレームをドラッグで移動・角をつまんでサイズ変更できます
            </p>
            {/* チェキ風カード */}
            <div
              className="relative w-full max-w-md select-none rounded-md border border-zinc-200 bg-white"
              style={{ aspectRatio: cardAspect }}
            >
              {/* 写真エリア（リボンはこの中だけ） */}
              <div
                ref={photoRef}
                className="absolute touch-none overflow-hidden bg-zinc-100"
                style={{
                  left: `${photoBox.left}%`,
                  top: `${photoBox.top}%`,
                  width: `${photoBox.width}%`,
                  height: `${photoBox.height}%`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt="アップロードした写真"
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                />
                {/* フレーム（移動・リサイズ可能。選択枠つき） */}
                <div
                  className="absolute cursor-move outline outline-2 outline-dashed outline-brand-blue"
                  style={{
                    width: `${framePct.width}%`,
                    height: `${framePct.height}%`,
                    left: `${framePct.left}%`,
                    top: `${framePct.top}%`,
                    backgroundImage: `url(${FRAME_PNG[frameColor]})`,
                    backgroundSize: "100% 100%",
                  }}
                  onPointerDown={(e) => onPointerDown("move", e)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  {(
                    [
                      "-top-2 -left-2",
                      "-top-2 -right-2",
                      "-bottom-2 -left-2",
                      "-bottom-2 -right-2",
                    ] as const
                  ).map((pos) => (
                    <span
                      key={pos}
                      className={`absolute ${pos} h-4 w-4 cursor-nwse-resize rounded-full border-2 border-brand-blue bg-white`}
                      onPointerDown={(e) => onPointerDown("resize", e)}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerCancel={onPointerUp}
                    />
                  ))}
                </div>
              </div>

              {/* 下の余白: ハッシュタグ（左）と QR（右） */}
              <div
                className="absolute flex items-center justify-between"
                style={{
                  left: `${captionBox.padX}%`,
                  right: `${captionBox.padX}%`,
                  top: `${captionBox.top}%`,
                  height: `${captionBox.height}%`,
                }}
              >
                <span className="flex min-w-0 flex-col justify-center">
                  <span
                    className="truncate font-black text-zinc-900"
                    style={{
                      fontFamily: "var(--font-wordmark)",
                      fontSize: "clamp(11px, 4vw, 24px)",
                    }}
                  >
                    {HASHTAG}
                  </span>
                  {normalizedId && (
                    <span
                      className="truncate font-medium text-zinc-500"
                      style={{ fontSize: "clamp(9px, 3vw, 16px)" }}
                    >
                      {normalizedId}
                    </span>
                  )}
                </span>
                {qrUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrUrl} alt="" aria-hidden className="h-[82%] w-auto" />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex aspect-[4/5] w-full max-w-md items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50">
            <p className="px-6 text-center text-sm font-medium text-zinc-400">
              写真を選ぶと、ここで編集できます
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleDownload}
          disabled={!ready || downloading}
          className={`w-full max-w-md rounded-full px-6 py-3.5 text-center font-bold transition ${
            ready && !downloading
              ? "bg-brand-blue text-white hover:bg-brand-blue-dark"
              : "cursor-not-allowed bg-zinc-200 text-zinc-400"
          }`}
        >
          {downloading ? "作成中…" : "画像をダウンロード"}
        </button>
      </div>
    </div>
  );
}
