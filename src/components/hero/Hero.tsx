"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import type { DragState } from "./HeroScene";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

// 可動域（ラジアン、左右のみ・控えめに）
const MAX_Y = 0.26;
// タッチのドラッグ感度
const DRAG_SENSITIVITY = 0.9;

/**
 * 紙吹雪・立ち絵・「2周年」を 1 つの three.js シーンにまとめた立体ヒーロー。
 * PC はホバー（カーソル位置）で左右に追従、タッチは左右ドラッグで視差が付く。
 * 上下方向の動きは付けない。
 */
export function Hero({ gallery = [] }: { gallery?: string[] }) {
  const drag = useRef<DragState>({ x: 0, y: 0 });
  const touch = useRef<{ id: number; x: number } | null>(null);

  function onPointerMove(e: React.PointerEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.pointerType === "touch") {
      const t = touch.current;
      if (!t || t.id !== e.pointerId) return;
      drag.current.y = clamp(
        drag.current.y + ((e.clientX - t.x) / rect.width) * DRAG_SENSITIVITY,
        MAX_Y,
      );
      t.x = e.clientX;
      return;
    }
    // マウス / ペン: ホバーの水平位置に比例（上下は動かさない）
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
    drag.current.y = clamp(nx * 2 * MAX_Y, MAX_Y);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "touch") return;
    // ポインタをキャプチャしない → 縦スワイプはブラウザのスクロールに任せる
    touch.current = { id: e.pointerId, x: e.clientX };
  }

  function onPointerUp(e: React.PointerEvent) {
    if (touch.current?.id === e.pointerId) touch.current = null;
  }

  // カーソルが離れたら中央へ戻す
  function onPointerLeave() {
    drag.current.y = 0;
  }

  return (
    <div
      // touch-action: pan-y … 縦スワイプはページスクロール、横だけ視差に使う
      className="relative h-[74vh] max-h-[760px] min-h-[440px] w-full touch-pan-y select-none"
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      <HeroScene drag={drag} gallery={gallery} />
    </div>
  );
}

function clamp(v: number, max: number): number {
  return v < -max ? -max : v > max ? max : v;
}
