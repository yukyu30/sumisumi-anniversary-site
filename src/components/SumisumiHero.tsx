/**
 * トップページのヒーロービジュアル。
 * Phase 8 で three.js + @pixiv/three-vrm の 3D ビューアに差し替える。
 * それまでは墨テーマの静的プレースホルダーを表示する。
 */
export function SumisumiHero() {
  return (
    <div
      aria-hidden
      className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-inner"
    >
      {/* 墨のにじみ */}
      <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-stone-900/10 blur-2xl" />
      <div className="absolute -bottom-16 -right-8 h-64 w-64 rounded-full bg-stone-900/15 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p className="text-7xl font-bold tracking-widest text-stone-900">
          墨澄
        </p>
        <p className="mt-3 text-xs tracking-[0.5em] text-stone-400">
          SUMISUMI
        </p>
      </div>
    </div>
  );
}
