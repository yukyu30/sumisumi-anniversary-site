"use client";

import { useRef, useState } from "react";
import { formatJst } from "@/lib/format";

interface Props {
  imageUrl: string;
  id: string;
  years: number;
  issuedAt: number;
}

/**
 * 検証に通った画像を、立体的に傾き・テカリ（光沢）が動くチェキとして表示する。
 * マウス / タッチの位置で 3D 傾き + 光沢ハイライトが追従する。
 */
export function VerifiedCheki({ imageUrl, id, years, issuedAt }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 0, on: false });

  function onMove(e: React.PointerEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ ry: (px - 0.5) * 22, rx: -(py - 0.5) * 22 });
    setGlare({ x: px * 100, y: py * 100, on: true });
  }
  function onLeave() {
    setTilt({ rx: 0, ry: 0 });
    setGlare((g) => ({ ...g, on: false }));
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="w-full" style={{ perspective: 1400 }}>
        <div
          ref={ref}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          onPointerCancel={onLeave}
          className="relative mx-auto w-full max-w-3xl touch-none overflow-hidden rounded-lg bg-white shadow-2xl transition-transform duration-150 ease-out will-change-transform"
          style={{
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${id} の記念画像`}
            className="block w-full select-none"
            draggable={false}
          />
          {/* うっすら SumiSumi ホログラム（傾きで虹色がシフト） */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-150"
            style={{
              opacity: glare.on ? 0.7 : 0,
              // 光が当たっているスポットだけ文字が浮かび上がる
              WebkitMaskImage: `radial-gradient(circle at ${glare.x}% ${glare.y}%, #000 0%, #000 10%, transparent 34%)`,
              maskImage: `radial-gradient(circle at ${glare.x}% ${glare.y}%, #000 0%, #000 10%, transparent 34%)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "-50%",
                transform: "rotate(-22deg)",
                fontFamily: "var(--font-wordmark)",
                fontWeight: 800,
                fontSize: 76,
                lineHeight: "1.7em",
                letterSpacing: "0.28em",
                wordBreak: "break-word",
                color: "transparent",
                backgroundImage:
                  "linear-gradient(115deg, #ff5ea3, #ffd23f, #4be3c7, #6aa3ff, #d07bff, #ff5ea3)",
                backgroundSize: "220% 220%",
                backgroundPosition: `${glare.x}% ${glare.y}%`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                mixBlendMode: "color-dodge",
              }}
            >
              {"SumiSumi ".repeat(200)}
            </div>
          </div>
          {/* 光沢（テカリ） */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 transition-opacity duration-150"
            style={{
              opacity: glare.on ? 1 : 0,
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.55), rgba(255,255,255,0.12) 30%, rgba(255,255,255,0) 60%)`,
              mixBlendMode: "screen",
            }}
          />
          {/* 斜めのハイライトライン */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 transition-opacity duration-150"
            style={{
              opacity: glare.on ? 0.5 : 0,
              background:
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 48%, transparent 56%)",
              transform: `translateX(${(glare.x - 50) * 0.6}%)`,
              mixBlendMode: "screen",
            }}
          />
        </div>
      </div>

      {/* 解読された内容 */}
      <div className="rounded-3xl border-2 border-brand-blue bg-white px-8 py-6 text-center">
        <p className="wordmark inline-block rounded-full bg-brand-blue px-4 py-1.5 text-sm font-bold tracking-widest text-white">
          ✓ VERIFIED
        </p>
        <p className="mt-4 text-3xl font-black">{id}</p>
        <p className="mt-1 text-xl font-black text-brand-blue">祝 {years}周年</p>
        <p className="mt-4 text-sm font-bold text-zinc-500">
          {formatJst(issuedAt)} 発行
        </p>
      </div>
    </div>
  );
}
