"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// three.js はクライアント専用なので SSR を切って遅延読み込みする
const VrmViewer = dynamic(() => import("./VrmViewer"), { ssr: false });

/**
 * トップページのヒーロービジュアル。
 * VRM (約 48MB) を勝手にダウンロードさせないよう、クリックで 3D 表示に切り替える。
 */
export function SumisumiHero() {
  const [show3d, setShow3d] = useState(false);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-inner">
      {/* 墨のにじみ */}
      <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-stone-900/10 blur-2xl" />
      <div className="absolute -bottom-16 -right-8 h-64 w-64 rounded-full bg-stone-900/15 blur-3xl" />

      {show3d ? (
        <VrmViewer />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-7xl font-bold tracking-widest text-stone-900">
            墨澄
          </p>
          <p className="mt-3 text-xs tracking-[0.5em] text-stone-400">
            SUMISUMI
          </p>
          <button
            onClick={() => setShow3d(true)}
            className="mt-8 rounded-full border border-stone-400 px-5 py-2 text-xs text-stone-600 transition hover:bg-stone-100"
          >
            3D で墨澄を見る（約 48MB）
          </button>
        </div>
      )}
    </div>
  );
}
