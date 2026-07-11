"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// three.js はクライアント専用なので SSR を切って遅延読み込みする
const VrmViewer = dynamic(() => import("./VrmViewer"), { ssr: false });

/**
 * トップページのヒーロービジュアル（墨澄）。
 * VRM (約 48MB) を勝手にダウンロードさせないよう、クリックで 3D 表示に切り替える。
 */
export function SumisumiHero() {
  const [show3d, setShow3d] = useState(false);

  return (
    <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-3xl border-4 border-white bg-brand-blue shadow-2xl">
      {/* 背景のワードマーク */}
      <span className="wordmark pointer-events-none absolute -right-4 top-2 select-none text-6xl text-white/15">
        sumi
      </span>

      {show3d ? (
        <VrmViewer />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
          <p className="text-7xl font-black tracking-widest">墨澄</p>
          <p className="wordmark mt-2 text-sm tracking-[0.4em] text-white/80">
            SUMISUMI
          </p>
          <button
            onClick={() => setShow3d(true)}
            className="mt-8 rounded-full bg-white px-5 py-2 text-xs font-bold text-brand-blue transition hover:bg-white/90"
          >
            3D で墨澄を見る（約 48MB）
          </button>
        </div>
      )}
    </div>
  );
}
