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
    <div className="flex flex-col items-center gap-6">
      <div style={{ perspective: 1000 }}>
        <div
          ref={ref}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          onPointerCancel={onLeave}
          className="relative w-72 max-w-full touch-none overflow-hidden rounded-lg bg-white shadow-2xl transition-transform duration-150 ease-out will-change-transform sm:w-80"
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
