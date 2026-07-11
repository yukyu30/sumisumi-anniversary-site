"use client";

import dynamic from "next/dynamic";

// R3F の Canvas はブラウザ専用なので SSR を切って読み込む
const ConfettiScene = dynamic(() => import("./ConfettiScene"), { ssr: false });

/** ヒーロー背景に降り続ける 3D 紙吹雪 */
export function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <ConfettiScene />
    </div>
  );
}
