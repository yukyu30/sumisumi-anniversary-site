/**
 * トップページのヒーロービジュアル（墨澄の立ち絵）。
 * 透過画像なので背景カードは置かず、紙吹雪の上に立たせる。
 */
export function SumisumiHero() {
  return (
    <div className="relative flex w-full justify-center">
      {/* 足元の影 */}
      <div className="pointer-events-none absolute bottom-2 left-1/2 h-6 w-2/3 -translate-x-1/2 rounded-[100%] bg-zinc-900/20 blur-md" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/sumusumi-pose.webp"
        alt="ピースサインをする墨澄 -SumiSumi-"
        className="relative h-auto w-auto max-h-[62vh] drop-shadow-[0_16px_24px_rgba(0,0,0,0.18)]"
      />
    </div>
  );
}
